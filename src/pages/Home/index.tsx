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
  ProFormItem,
  ProFormList,
  ProFormRadio,
  ProFormText
} from '@ant-design/pro-components';
import { useModel } from '@umijs/max';
import styles from './index.less';
import logoSony from "@/assets/logo/Sony.svg";
import logoCanon from "@/assets/logo/Canon.svg";
import logoNikon from "@/assets/logo/Nikon.svg";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Col, Divider, Dropdown, Modal, Row, Space, Spin, Upload, UploadFile } from 'antd';
import handlebars from 'handlebars';
import { downloadBlob } from '@/utils';
import { EditOutlined, FileImageOutlined, PlusOutlined } from '@ant-design/icons';
import { UploadChangeParam } from "antd/lib/upload/interface";
import { useDebounceFn } from 'ahooks';
// @ts-ignore
import { CheckGroupValueType } from "@ant-design/pro-card/lib/components/CheckCard/Group";
import { isNil } from "lodash";
import { CanvasConfig, ConfigType, getExif, ImageExifInfo, TextConfigType } from "./commons";


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
  openDrawer: false,
};

const defaultExifInfo: ImageExifInfo = {
  光圈: "", 快门: "", 感光度: "", 拍摄时间: "", 焦距: "", 版权: "", 相机品牌: "", 相机型号: "", 镜头型号: ""
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
    borderPercentage: { left: 0, top: 0, right: 0, bottom: 0.08 }
  }), [image]);

  const initCanvas = useCallback(async () => {
    canvasConfig.print();
    const canvas = canvasRef.current;
    if (image == null || canvas == null) {
      return;
    }
    console.log(config.items)
    await canvasConfig.render(config.bg, logoImage, config.items || [], imageExifInfo);
  }, [config, image, logoImage, canvasConfig]);


  const loadExif = useCallback((image: HTMLImageElement | null) => {
    if (image == null) {
      return;
    }
    getExif(image).then(res => {
      setImageExifInfo(res);
      switch (res.相机品牌.toLowerCase()) {
        case 'sony':
          setLogoImageSrc(logoSony);
          break;
        case 'canon':
          setLogoImageSrc(logoCanon);
          break;
        case 'nikon':
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
            x: Math.floor(image.width - image.width * 0.015),
            y: image.height - Math.floor(image.width * 0.015),
            bg: '#fff',
            fontSize: Math.floor(border.bottom * 0.30),
            fontSizeUnit: 'px',
            textBaseline: 'alphabetic',
            textAlign: 'right',
            fontWeight: 'bolder',
          },
          {
            ...defaultText,
            textTpl: '{{相机品牌}} {{相机型号}}',
            x: Math.floor(image.width * 0.015),
            y: Math.floor(border.bottom * 0.20) + image.height,
            fontSize: Math.floor(border.bottom * 0.30),
            fontSizeUnit: 'px',
            textBaseline: 'top',
            textAlign: 'left',
            fontWeight: 'bolder',
          },
          {
            ...defaultText,
            textTpl: '{{拍摄时间}}',
            x: Math.floor(image.width * 0.015),
            y: Math.floor(border.bottom * 0.60) + image.height,
            fontSize: Math.floor(border.bottom * 0.25),
            fontSizeUnit: 'px',
            textBaseline: 'top',
            textAlign: 'left',
            fontWeight: 'normal',
          },
          {
            ...defaultText,
            textTpl: '{{镜头型号}}',
            x: Math.floor(image.width - image.width * 0.015),
            y: Math.floor(border.bottom * 0.20) + image.height,
            fontSize: Math.floor(border.bottom * 0.30),
            fontSizeUnit: 'px',
            textBaseline: 'top',
            textAlign: 'right',
            fontWeight: 'bolder',
          },
          {
            ...defaultText,
            textTpl: '{{光圈}} {{快门}} {{焦距}} ISO{{感光度}}',
            x: Math.floor(image.width - image.width * 0.015),
            y: Math.floor(border.bottom * 0.60) + image.height,
            fontSize: Math.floor(border.bottom * 0.25),
            fontSizeUnit: 'px',
            textBaseline: 'top',
            textAlign: 'right',
            fontWeight: 'normal',
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
    if (isNil(logoImageSrc)) {
      setLogoImage(null);
      return;
    }
    const logo = new Image();
    logo.src = logoImageSrc + '';
    logo.onload = () => setLogoImage(logo);
  }, [logoImageSrc]);

  const isWeXinBrowser = useMemo(() => {
    return navigator.userAgent.includes('Weixin') || navigator.userAgent.includes('WeChat');
  }, []);

  return (
    <PageContainer>
      <Spin spinning={loading}>
        <Alert message="为保护用户隐私，图片不会上传到服务器，图片仅在本地浏览器进行处理" type="info"
               style={{ marginBottom: 15 }} />
        {
          isWeXinBrowser &&
          <Alert message="微信浏览器无法保存图片，请点击右上角用浏览器访问"
                 type="warning"
                 style={{ marginBottom: 15 }} />

        }
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
          <Col {...{ xxl: 8, xl: 8, lg: 12, md: 12, sm: 24 }}>
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
          <Col {...{ xxl: 8, xl: 8, lg: 24, md: 24, sm: 24 }}>
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
          menu={{
            onClick: (info: any) => saveImage(info.key),
            items: [
              { label: 'JPG', key: 'jpg', icon: <FileImageOutlined />, },
              { label: 'PNG', key: 'png', icon: <FileImageOutlined />, },
            ]
          }}
          onClick={() => saveImage('jpg')}
          style={{ marginBottom: 15 }}
        >保存图片 ( JPG )</Dropdown.Button>
        {/*<RcImage
          width={200}
          style={{ display: 'none' }}
          src="https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png?x-oss-process=image/blur,r_50,s_50/quality,q_1/resize,m_mfit,h_200,w_200"
          preview={{
            visible: true,
            scaleStep: 1.0,
            src: 'https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png',
            onVisibleChange: (value) => {
              // setVisible(value);
            },
          }}
        />*/}
        <div className={styles.canvasBox}>
          <canvas ref={canvasRef}></canvas>
        </div>
        {
          isWeXinBrowser &&
          <Alert message="微信浏览器无法保存图片，请点击右上角用浏览器访问"
                 type="warning"
                 style={{ marginBottom: 15 }} />

        }
        <Dropdown.Button
          menu={{
            onClick: (info: any) => saveImage(info.key),
            items: [
              { label: 'JPG', key: 'jpg', icon: <FileImageOutlined />, },
              { label: 'PNG', key: 'png', icon: <FileImageOutlined />, },
            ]
          }}
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
            <ProFormList<TextConfigType>
              name={'items'}
              creatorButtonProps={{ creatorButtonText: '添加文字', }}
              creatorRecord={{ ...defaultText, }}
            >
              {(meta, index, action, count) => {
                const data = action.getCurrentRowData();
                const openDrawer = data.openDrawer;
                // console.log('ProFormList', meta, index, action, count, data);
                return <ProFormGroup>
                  <ProFormText name={'textTpl'} label={'文字'} width={'lg'} />
                  <ProFormDigit name={'x'} label={'X坐标'} width={'xs'} />
                  <ProFormDigit name={'y'} label={'Y坐标'} width={'xs'} />
                  <ProFormItem label={'操作'}>
                    <a type={'link'} onClick={() => action.setCurrentRowData({ ...data, openDrawer: !openDrawer })}>
                      编辑样式 <EditOutlined />
                    </a>
                  </ProFormItem>
                  <Modal
                    title={'样式编辑'}
                    open={openDrawer}
                    width={960}
                    // onClose={() => action.setCurrentRowData({ ...data, openDrawer: !openDrawer })}
                    onCancel={() => action.setCurrentRowData({ ...data, openDrawer: !openDrawer })}
                    maskClosable={true}
                    centered={true}
                    footer={false}
                  >
                    <ProFormDigit name={'fontSize'} label={'字体大小'} width={'lg'} />
                    <ProFormRadio.Group
                      radioType={"button"}
                      fieldProps={{ buttonStyle: 'solid' }}
                      name={'fontSizeUnit'}
                      label={'字体单位'}
                      options={['pt', 'px', 'em', 'rem', 'in',]} />
                    <ProFormRadio.Group
                      radioType={"button"}
                      fieldProps={{ buttonStyle: 'solid' }}
                      name={'textBaseline'} label={'文字基线'}
                      options={['top', 'middle', 'bottom', 'ideographic', 'hanging', 'alphabetic',]} />
                    <ProFormRadio.Group
                      radioType={"button"}
                      fieldProps={{ buttonStyle: 'solid' }}
                      name={'textAlign'}
                      label={'对齐'}
                      options={['left', 'right', 'center', 'end', 'start',]} />
                    <ProFormRadio.Group
                      radioType={"button"}
                      fieldProps={{ buttonStyle: 'solid' }}
                      name={'fontWeight'}
                      label={'字体粗细'}
                      options={['normal', 'bold', 'bolder', 'lighter',]} />
                    <ProFormColorPicker
                      name={'bg'}
                      label={'颜色'}
                      fieldProps={{
                        // @ts-ignore
                        showText: (color: any) => color.toHexString(),
                        style: { display: 'inline-flex', width: "auto" },
                      }}
                    />
                  </Modal>
                </ProFormGroup>
              }}
            </ProFormList>
          </ProForm>
        </ProCard>
      </Spin>
    </PageContainer>
  );
};

export default HomePage;
