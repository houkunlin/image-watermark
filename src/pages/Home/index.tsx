import {
  CheckCard,
  FormInstance,
  PageContainer,
  ProCard,
  ProDescriptions,
  ProForm,
  ProFormColorPicker,
  ProFormDigit,
  ProFormGroup,
  ProFormList,
  ProFormSelect,
  ProFormText
} from '@ant-design/pro-components';
import { useModel } from '@umijs/max';
import styles from './index.less';
import logoSony from "@/assets/logo/Sony.svg";
import logoCanon from "@/assets/logo/Canon.svg";
import logoNikon from "@/assets/logo/Nikon.svg";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as math from "mathjs";
import exif from "exif-js";
import { Alert, Col, Divider, Dropdown, Menu, Row, Space, Spin, Upload, UploadFile } from 'antd';
import handlebars from 'handlebars';
import { downloadBlob } from '@/utils';
import { FileImageOutlined, PlusOutlined } from '@ant-design/icons';
import { UploadChangeParam } from "antd/lib/upload/interface";
import { useDebounceFn } from 'ahooks';
// @ts-ignore
import { CheckGroupValueType } from "@ant-design/pro-card/lib/components/CheckCard/Group";

// ImageExifInfo(相机品牌 = SONY, 相机型号 = ILCE-7RM3A, 镜头型号 = FE 24-105mm F4 G OSS, 版权 = houkunlin, 拍摄时间 = 2021-07-24 19:50:17, 光圈 = f/4, 快门 = 1/40 s, 焦距 = 105 mm, 感光度 = 1000 )
// ImageExifInfo(相机品牌 = SONY, 相机型号 = ILCE-7RM3A, 镜头型号 = FE 24-105mm F4 G OSS, 版权 = houkunlin, 拍摄时间 = 2022-07-01 19:18:47, 光圈 = f/8, 快门 = 1/200 s, 焦距 = 105 mm, 感光度 = 200 )

type ImageExifInfo = {
  // 相机品牌
  相机品牌: string;
  // 相机型号
  相机型号: string;
  // 镜头型号
  镜头型号: string;
  // 版权
  版权: string;
  // 拍摄时间
  拍摄时间: string;
  // 光圈
  光圈: string;
  // 快门
  快门: string;
  // 焦距
  焦距: string;
  // 感光度
  感光度: string;
}

const getFractionStr = (num: number | string | Number, after: string = '') => {
  if (num == null) {
    return '';
  }
  const re = math.fraction(`${num}`);
  return `${re.n}/${re.d}${after}`;
};

const getExif = (img: any): Promise<ImageExifInfo> => {
  const getTagStr = (tag: string, before: string = '', after: string = ''): string => {
    const str = exif.getTag(img, tag);
    if (str == null) {
      return '';
    }
    return before + `${str}`.replaceAll(/ +/g, ' ').replaceAll(/\x00/g, '').trim() + after;
  }
  return new Promise((resolve, reject) => {
    exif.getData(img, () => {
      console.log('相机 exif', exif.getAllTags(img));
      resolve({
        相机品牌: getTagStr("Make"),
        相机型号: getTagStr("Model"),
        镜头型号: getTagStr("undefined"),
        版权: getTagStr("Copyright"),
        拍摄时间: getTagStr("DateTimeOriginal"),
        光圈: getTagStr("FNumber", 'f/'),
        快门: getFractionStr(exif.getTag(img, "ExposureTime"), 's'),
        焦距: getTagStr("FocalLength", '', 'mm'),
        感光度: getTagStr("ISOSpeedRatings"),
      })
    });
  })
};

type TextConfigType = {
  x: number,
  y: number,
  bg: string,
  fontSize: number,
  fontSizeUnit: 'em' | 'pt' | 'px' | 'rem' | 'in',
  textTpl: string,
  textBaseline: CanvasTextBaseline,
  textAlign: CanvasTextAlign,
  fontWeight: 'normal' | 'bold' | 'bolder' | 'lighter',
  getFontStr: () => string,
  getTextStr: (imageExifInfo: ImageExifInfo) => string,
}

class TextConfig {
  x: number;
  y: number;
  bg: string;
  fontSize: number;
  fontSizeUnit: 'em' | 'pt' | 'px' | 'rem' | 'in';
  textTpl: string;
  textBaseline: CanvasTextBaseline;
  textAlign: CanvasTextAlign;
  fontWeight: 'normal' | 'bold' | 'bolder' | 'lighter';

  constructor(config: TextConfigType) {
    this.x = config.x;
    this.y = config.y;
    this.bg = config.bg;
    this.fontSize = config.fontSize;
    this.fontSizeUnit = config.fontSizeUnit;
    this.textTpl = config.textTpl;
    this.textBaseline = config.textBaseline;
    this.textAlign = config.textAlign;
    this.fontWeight = config.fontWeight;
  }

  public getFontStr() {
    return `${this.fontWeight} ${this.fontSize}${this.fontSizeUnit} Consolas`;
  }
}

const defaultText: TextConfigType = {
  x: 100,
  y: 250,
  bg: '#000',
  fontSize: 8,
  fontSizeUnit: 'em',
  textTpl: '{{相机品牌}} {{相机型号}}',
  textBaseline: 'top',
  textAlign: 'left',
  fontWeight: 'normal',
  getFontStr: function () {
    return `${this.fontWeight} ${this.fontSize}${this.fontSizeUnit} Consolas`;
  },
  getTextStr: function (imageExifInfo: ImageExifInfo) {
    try {
      return handlebars.compile(this.textTpl)(imageExifInfo)
    } catch (e) {
      return this.textTpl;
    }
  },
};
const defaultExifInfo: ImageExifInfo = {
  光圈: "", 快门: "", 感光度: "", 拍摄时间: "", 焦距: "", 版权: "", 相机品牌: "", 相机型号: "", 镜头型号: ""
}

type ConfigType = {
  items: TextConfigType[];
  bg: string;
}

class CanvasConfig {
  el: {
    image: HTMLImageElement,
    canvas: HTMLCanvasElement,
    context: CanvasRenderingContext2D,
  };
  image: { width: number, height: number; };
  canvas: { width: number, height: number; };
  border: { left: number, top: number, right: number; bottom: number; };
  borderPercentage: { left: number, top: number, right: number; bottom: number; };
  ready: boolean;

  constructor(imageElement: HTMLImageElement | null, canvas: HTMLCanvasElement | null, config: any) {
    this.ready = !(imageElement == null || canvas == null);
    this.el = {
      image: imageElement ? imageElement : {} as HTMLImageElement,
      canvas: canvas ? canvas : {} as HTMLCanvasElement,
      context: canvas ? canvas.getContext('2d')! : {} as CanvasRenderingContext2D,
    };
    this.image = { width: imageElement?.naturalWidth || 0, height: imageElement?.naturalHeight || 0, };
    this.borderPercentage = config.borderPercentage;
    this.border = {
      left: Math.floor(this.image.width * this.borderPercentage.left),
      top: Math.floor(this.image.width * this.borderPercentage.top),
      right: Math.floor(this.image.width * this.borderPercentage.right),
      bottom: Math.floor(this.image.width * this.borderPercentage.bottom),
    };
    this.canvas = {
      width: this.image.width + this.border.left + this.border.right,
      height: this.image.height + this.border.top + this.border.bottom,
    };
  }

  public initCanvas(fillStyle: string = '#fff') {
    this.el.canvas.width = this.canvas.width;
    this.el.canvas.height = this.canvas.height;

    this.el.context.fillStyle = fillStyle;
    this.el.context.rect(0, 0, this.canvas.width, this.canvas.height);
    this.el.context.fill();
  }

  public async drawImage() {
    this.el.context.drawImage(await createImageBitmap(this.el.image),
      0, 0,
      this.image.width, this.image.height,
      this.border.left, this.border.top,
      this.image.width, this.image.height
    );
  }

  public drawLogo(logoImage: HTMLImageElement | null, padding: number = 0.20) {
    if (logoImage == null) {
      return;
    }
    const context = this.el.context;
    const width = logoImage.naturalWidth;
    const height = logoImage.naturalHeight;
    const bi = height / width;

    const newHeight = Math.floor(this.border.bottom * (1 - padding * 2));
    const newWidth = Math.floor(newHeight / height * width);

    console.log(`
    Logo原宽高：${width}*${height}
    Logo新宽高：${newWidth}*${newHeight}
    Logo坐标：x=${this.image.width / 2 - newWidth / 2}, y=${this.image.height + this.border.bottom * padding}
    `)

    context.drawImage(logoImage, 0, 0, width, height, (this.image.width / 2 - newWidth / 2), (this.image.height + this.border.bottom * padding), newWidth, newHeight);
  }

  public drawTexts(texts: TextConfigType[], imageExifInfo: ImageExifInfo) {
    const context = this.el.context;
    for (let item of texts) {
      context.font = item.getFontStr();
      context.textAlign = item.textAlign;
      context.textBaseline = item.textBaseline;
      context.fillStyle = item.bg;
      context.fillText(item.getTextStr(imageExifInfo), item.x, item.y);
    }
  }

  public async render(fillStyle: string = '#fff', logoImage: HTMLImageElement | null, texts: TextConfigType[] = [], imageExifInfo: ImageExifInfo) {
    if (!this.ready) {
      return;
    }
    this.initCanvas(fillStyle);
    await this.drawImage();
    this.drawLogo(logoImage);
    this.drawTexts(texts, imageExifInfo);
  }

  public print() {
    console.log(`
    图片：${this.image.width}*${this.image.height}
    画布：${this.canvas.width}*${this.canvas.height}
    边框：left=${this.border.left}, top=${this.border.top}, right=${this.border.right}, bottom=${this.border.bottom}
    边框比例：left=${this.borderPercentage.left}, top=${this.borderPercentage.top}, right=${this.borderPercentage.right}, bottom=${this.borderPercentage.bottom}
    `)
  }
}

const logos = [
  { avatar: (<img alt={'索尼'} src={logoSony} style={{ width: '100%', height: '50px' }} />), value: logoSony, },
  { avatar: (<img alt="佳能" src={logoCanon} style={{ width: '100%', height: '50px' }} />), value: logoCanon, },
  { avatar: (<img alt="尼康" src={logoNikon} style={{ width: '100%', height: '50px' }} />), value: logoNikon, },
]

const HomePage: React.FC = () => {
  const { name } = useModel('global');
  const formRef = useRef<FormInstance>();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [logoImage, setLogoImage] = useState<HTMLImageElement | null>(null);
  const [logoImageSrc, setLogoImageSrc] = useState<CheckGroupValueType>();
  const [imageExifInfo, setImageExifInfo] = useState<ImageExifInfo>(defaultExifInfo);
  const [config, setConfig] = useState<ConfigType>({ items: [], bg: '#fff' });
  const [imageFilename, setImageFilename] = useState<string>('保存图片');
  const [loading, setLoading] = useState<boolean>(false);

  const { run: setConfigDebounceFn } = useDebounceFn((changedValues, values) => {
    setConfig({ ...values });
  }, { wait: 200 });

  const canvasConfig = useMemo(() => new CanvasConfig(image, canvasRef.current, {
    borderPercentage: { left: 0, top: 0, right: 0, bottom: 0.0625 }
  }), [image]);

  const initCanvas = useCallback(async () => {
    canvasConfig.print();
    const canvas = canvasRef.current;
    if (image == null || canvas == null) {
      return;
    }
    await canvasConfig.render(config.bg, logoImage, config.items || [], imageExifInfo);
  }, [config, image, logoImage, canvasConfig]);


  const loadExif = useCallback((image: HTMLImageElement | null) => {
    if (image == null) {
      return;
    }
    getExif(image).then(res => {
      setImageExifInfo(res);
      switch (res.相机品牌) {
        case 'SONY':
          setLogoImageSrc(logoSony);
          break;
        case 'CANON':
          setLogoImageSrc(logoCanon);
          break;
        case 'NIKON':
          setLogoImageSrc(logoNikon);
          break;
      }
      const image = canvasConfig.image;
      const border = canvasConfig.border;
      const cfg: ConfigType = {
        ...config,
        items: [
          {
            ...defaultText,
            textTpl: '©{{版权}}',
            x: Math.floor(image.width - 0.015 * image.width),
            y: image.height - Math.floor(0.015 * image.width * 2),
            bg: '#fff',
            textAlign: 'right',
            fontWeight: 'bolder',
          },
          {
            ...defaultText,
            textTpl: '{{相机品牌}} {{相机型号}}',
            x: Math.floor(0.015 * image.width),
            y: Math.floor(0.20 * border.bottom) + image.height,
            fontWeight: 'bolder',
          },
          {
            ...defaultText,
            textTpl: '{{拍摄时间}}',
            x: Math.floor(0.015 * image.width),
            y: Math.floor(0.60 * border.bottom) + image.height,
            fontSize: 7
          },
          {
            ...defaultText,
            textTpl: '{{镜头型号}}',
            x: Math.floor(image.width - 0.015 * image.width),
            y: Math.floor(0.20 * border.bottom) + image.height,
            fontSize: 8,
            textAlign: 'right',
            fontWeight: 'bolder',
          },
          {
            ...defaultText,
            textTpl: '{{光圈}} {{快门}} {{焦距}} ISO{{感光度}}',
            x: Math.floor(image.width - 0.015 * image.width),
            y: Math.floor(0.60 * border.bottom) + image.height,
            fontSize: 7,
            textAlign: 'right',
          },
        ]
      };
      formRef.current?.setFieldsValue(cfg);
      setConfig(cfg);
    });
  }, [image]);
  const saveImage = useCallback((ext: string = 'jpg', quality: any | null = null) => {
    const filename = imageFilename.substring(0, imageFilename.lastIndexOf('.'));
    setLoading(true);
    const fileType: Record<string, string> = { jpg: 'image/jpeg', png: 'image/png', };
    const canvas = canvasRef.current!;
    canvas.toBlob(blob => {
      downloadBlob(blob!, `${filename}-photo-watermark.${ext}`);
      setLoading(false);
    }, fileType[ext], quality);
  }, [imageFilename]);

  const loadImageFile = useCallback((file: UploadFile, callback: (image: HTMLImageElement) => void) => {
    setLoading(true);
    const reader = new FileReader();
    reader.readAsDataURL(file.originFileObj as Blob);
    reader.onload = () => {
      const image = new Image();
      image.src = reader.result as string;
      image.onload = () => {
        console.log('选择图片', image.naturalWidth, image.naturalHeight);
        callback(image);
        setLoading(false);
      }
    };
  }, []);

  useEffect(() => {
    loadExif(image);
  }, [image]);
  useEffect(() => {
    initCanvas()
  }, [initCanvas]);
  useEffect(() => {
    if (logoImageSrc == null) {
      setLogoImage(null);
      return;
    }
    const logo = new Image();
    logo.src = logoImageSrc;
    logo.onload = () => setLogoImage(logo);
  }, [logoImageSrc]);

  return (
    <PageContainer>
      <Spin spinning={loading}>
        <Alert message="为保护用户隐私，图片不会上传到服务器，图片仅在本地浏览器进行处理" type="info" style={{ marginBottom: 15 }} />
        <ProCard ghost>
          <CheckCard.Group value={logoImageSrc} options={logos} onChange={setLogoImageSrc} />
        </ProCard>
        <Row gutter={20}>
          <Col {...{ xxl: 4, xl: 6, lg: 8, md: 12, sm: 24 }}>
            <Space>
              <Upload
                listType="picture-card"
                showUploadList={false}
                onChange={(info: UploadChangeParam) => {
                  loadImageFile(info.fileList[0], setImage);
                  setImageFilename(info.fileList[0].name);
                }}
                beforeUpload={() => false}
                maxCount={1}
              >
                <div>
                  <PlusOutlined />
                  <div style={{ marginTop: 8 }}>选择图片文件</div>
                </div>
              </Upload>
              <Upload
                listType="picture-card"
                showUploadList={false}
                onChange={(info: UploadChangeParam) => loadImageFile(info.fileList[0], setLogoImage)}
                beforeUpload={() => false}
                maxCount={1}
              >
                <div>
                  <PlusOutlined />
                  <div style={{ marginTop: 8 }}>选择LOGO文件</div>
                </div>
              </Upload>
            </Space>
          </Col>
          <Col {...{ xxl: 6, xl: 8, lg: 12, md: 12, sm: 24 }}>
            <ProDescriptions title="EXIF 信息" dataSource={imageExifInfo} column={2} columns={[
              { title: '相机品牌', dataIndex: '相机品牌', },
              { title: '相机型号', dataIndex: '相机型号', },
              { title: '镜头型号', dataIndex: '镜头型号', },
              { title: '版权', dataIndex: '版权', },
              { title: '拍摄时间', dataIndex: '拍摄时间', },
              { title: '光圈', dataIndex: '光圈', },
              { title: '快门', dataIndex: '快门', },
              { title: '焦距', dataIndex: '焦距', },
              { title: '感光度', dataIndex: '感光度', },
            ]} />
          </Col>
          <Col {...{ xxl: 6, xl: 8, lg: 24, md: 24, sm: 24 }}>
            <ProDescriptions title="照片信息" dataSource={canvasConfig.image} column={4} columns={[
              { title: '宽度', dataIndex: 'width', },
              { title: '高度', dataIndex: 'height', },
              { title: '文件名', dataIndex: 'height', render: () => imageFilename },
            ]} />
            <ProDescriptions title="画布" dataSource={canvasConfig.canvas} column={4} columns={[
              { title: '宽度', dataIndex: 'width', },
              { title: '高度', dataIndex: 'height', },
            ]} />
            <ProDescriptions title="边框宽度" dataSource={canvasConfig.border} column={4} columns={[
              { title: '左边', dataIndex: 'left', },
              { title: '顶边', dataIndex: 'top', },
              { title: '右边', dataIndex: 'right', },
              { title: '底边', dataIndex: 'bottom', },
            ]} />
          </Col>
        </Row>
        <Dropdown.Button
          overlay={<Menu
            onClick={(info: any) => saveImage(info.key)}
            items={[
              { label: 'JPG', key: 'jpg', icon: <FileImageOutlined />, },
              { label: 'PNG', key: 'png', icon: <FileImageOutlined />, },
            ]}
          />}
          onClick={() => saveImage('jpg')}
          style={{ marginBottom: 15 }}
        >保存图片 ( JPG )</Dropdown.Button>
        <div className={styles.canvasBox}>
          <canvas ref={canvasRef}></canvas>
        </div>
        {
          (navigator.userAgent.includes('Weixin') || navigator.userAgent.includes('WeChat')) && (
            <Alert message="微信浏览器无法保存图片，请点击右上角用浏览器访问" type="warning" style={{ marginBottom: 15 }} />
          )
        }
        <Dropdown.Button
          overlay={<Menu
            onClick={(info: any) => saveImage(info.key)}
            items={[
              { label: 'JPG', key: 'jpg', icon: <FileImageOutlined />, },
              { label: 'PNG', key: 'png', icon: <FileImageOutlined />, },
            ]}
          />}
          onClick={() => saveImage('jpg')}
          style={{ marginBottom: 15 }}
        >保存图片 ( JPG )</Dropdown.Button>
        <ProCard>
          <ProForm
            formRef={formRef}
            submitter={{ render: (props, dom) => null, }}
            onValuesChange={setConfigDebounceFn}
            initialValues={config}
          >
            <Divider orientation={'left'}>画布</Divider>
            <ProFormGroup>
              <ProFormColorPicker name={'bg'} label={'背景颜色'} />
            </ProFormGroup>
            <Divider orientation={'left'}>文字</Divider>
            <ProFormList
              name={'items'}
              creatorButtonProps={{ creatorButtonText: '添加文字', }}
              creatorRecord={{ ...defaultText, }}
            >
              <ProFormGroup>
                <ProFormText name={'textTpl'} label={'文字'} />
                <ProFormDigit name={'x'} label={'X坐标'} width={'xs'} />
                <ProFormDigit name={'y'} label={'Y坐标'} width={'xs'} />
                <ProFormDigit name={'fontSize'} label={'字体大小'} width={'xs'} />
                <ProFormSelect name={'fontSizeUnit'} label={'字体单位'} options={['pt', 'px', 'em', 'rem', 'in',]} />
                <ProFormSelect name={'textBaseline'} label={'文字基线'}
                               options={['top', 'middle', 'bottom', 'ideographic', 'hanging', 'alphabetic',]} />
                <ProFormSelect name={'textAlign'} label={'对齐'} options={['left', 'right', 'center', 'end', 'start',]} />
                <ProFormSelect name={'fontWeight'} label={'字体粗细'} options={['normal', 'bold', 'bolder', 'lighter',]} />
                <ProFormColorPicker name={'bg'} label={'颜色'} />
              </ProFormGroup>
            </ProFormList>
          </ProForm>
        </ProCard>
      </Spin>
    </PageContainer>
  );
};

export default HomePage;
