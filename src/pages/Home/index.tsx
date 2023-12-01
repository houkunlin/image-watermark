import { CheckCard, FormInstance, PageContainer, ProCard } from '@ant-design/pro-components';
import { useModel } from '@umijs/max';
import styles from './index.less';
import logoSony from "@/assets/logo/Sony.svg";
import logoCanon from "@/assets/logo/Canon.svg";
import logoNikon from "@/assets/logo/Nikon.svg";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Col, Row, Spin } from 'antd';
import { BorderSize, ConfigType, LogoSize, SquareSize, TextConfig } from "./commons";
import { useImage, useImageWatermark } from "../ImageWatermark/hooks";
import { isNil } from "lodash";
import { CheckGroupValueType } from "@ant-design/pro-card/es/components/CheckCard/Group";
import PhotoInfo from "@/pages/Home/PhotoInfo";
import PhotoConfigForm from "@/pages/Home/PhotoConfigForm";
import ActionButton from "@/pages/Home/ActionButton";

const defaultText = new TextConfig({
  x: 100,
  y: 250,
  color: '#000',
  fontSize: 8,
  fontSizeUnit: 'em',
  textTpl: '{{相机品牌}} {{相机型号}}',
  textBaseline: 'top',
  textAlign: 'left',
  fontWeight: 'normal',
});

const logos = [
  { avatar: (<img alt={'索尼'} src={logoSony} style={{ width: '100%', height: '50px' }} />), value: logoSony, },
  { avatar: (<img alt="佳能" src={logoCanon} style={{ width: '100%', height: '50px' }} />), value: logoCanon, },
  { avatar: (<img alt="尼康" src={logoNikon} style={{ width: '100%', height: '50px' }} />), value: logoNikon, },
]

type ConfigTypeTemplate = ConfigType & {
  /**
   * 文字大小基于图片宽度的比例
   */
  fontSize: number;
  /**
   * 除了边框之外，再加一个边框的设置，因为边框会加入一些其他的计算，改变边框会影响计算结果
   * 新增的这个边距不参与其他计算，将直接作为边框的边距
   */
  padding: BorderSize;
};

// 无预设配置
const c0: ConfigTypeTemplate = {
  background: '#fff',
  fontSize: 0.08,
  border: { left: 0, top: 0, right: 0, bottom: 0 },
  padding: { left: 0, top: 0, right: 0, bottom: 0 },
  logo: { height: 0, width: 0, x: 0, y: 0 },
  textItems: [
    {
      textTpl: '©{{版权}}',
      x: 0.985,
      y: -0.42,
      color: '#fff',
      fontSize: 0.30,
      fontSizeUnit: 'px',
      textBaseline: 'top',
      textAlign: 'right',
      fontWeight: 'bolder',
      openDrawer: false,
    },
  ]
}
// 预设配置1
const c1: ConfigTypeTemplate = {
  background: '#fff',
  fontSize: 0.08,
  border: { left: 0, top: 0, right: 0, bottom: 0.08 },
  padding: { left: 0, top: 0, right: 0, bottom: 0 },
  logo: { height: 0.08, width: 0, x: 0, y: 0 },
  textItems: [
    {
      textTpl: '©{{版权}}',
      x: 0.985,
      y: -0.42,
      color: '#fff',
      fontSize: 0.30,
      fontSizeUnit: 'px',
      textBaseline: 'top',
      textAlign: 'right',
      fontWeight: 'bolder',
      openDrawer: false,
    },
    {
      textTpl: '{{相机品牌}} {{相机型号}}',
      x: 0.015,
      y: 0.20,
      color: '#000',
      fontSize: 0.30,
      fontSizeUnit: 'px',
      textBaseline: 'top',
      textAlign: 'left',
      fontWeight: 'bolder',
      openDrawer: false,
    },
    {
      textTpl: '{{拍摄时间}}',
      x: 0.015,
      y: 0.60,
      color: '#000',
      fontSize: 0.25,
      fontSizeUnit: 'px',
      textBaseline: 'top',
      textAlign: 'left',
      fontWeight: 'normal',
      openDrawer: false,
    },
    {
      textTpl: '{{镜头型号}}',
      x: 0.985,
      y: 0.20,
      color: '#000',
      fontSize: 0.30,
      fontSizeUnit: 'px',
      textBaseline: 'top',
      textAlign: 'right',
      fontWeight: 'bolder',
      openDrawer: false,
    },
    {
      textTpl: '{{光圈}} {{快门}} {{焦距}} ISO{{感光度}}',
      x: 0.985,
      y: 0.60,
      color: '#000',
      fontSize: 0.25,
      fontSizeUnit: 'px',
      textBaseline: 'top',
      textAlign: 'right',
      fontWeight: 'normal',
      openDrawer: false,
    },
  ]
}
// 预设配置2
const c2: ConfigTypeTemplate = {
  background: '#fff',
  fontSize: 0.08,
  border: { left: 0.08, top: 0.08, right: 0.08, bottom: 0.08 },
  padding: { left: 0, top: 0, right: 0, bottom: 0.04 },
  logo: { height: 0.08, width: 0, x: 0, y: 0 },
  textItems: [
    {
      textTpl: '©{{版权}}',
      x: 0.985,
      y: -0.42,
      color: '#fff',
      fontSize: 0.30,
      fontSizeUnit: 'px',
      textBaseline: 'top',
      textAlign: 'right',
      fontWeight: 'bolder',
      openDrawer: false,
    },
    {
      textTpl: '{{相机品牌}} {{相机型号}}',
      x: 0.015,
      y: 0.20,
      color: '#000',
      fontSize: 0.30,
      fontSizeUnit: 'px',
      textBaseline: 'top',
      textAlign: 'left',
      fontWeight: 'bolder',
      openDrawer: false,
    },
    {
      textTpl: '{{拍摄时间}}',
      x: 0.015,
      y: 0.60,
      color: '#000',
      fontSize: 0.25,
      fontSizeUnit: 'px',
      textBaseline: 'top',
      textAlign: 'left',
      fontWeight: 'normal',
      openDrawer: false,
    },
    {
      textTpl: '{{镜头型号}}',
      x: 0.985,
      y: 0.20,
      color: '#000',
      fontSize: 0.30,
      fontSizeUnit: 'px',
      textBaseline: 'top',
      textAlign: 'right',
      fontWeight: 'bolder',
      openDrawer: false,
    },
    {
      textTpl: '{{光圈}} {{快门}} {{焦距}} ISO{{感光度}}',
      x: 0.985,
      y: 0.60,
      color: '#000',
      fontSize: 0.25,
      fontSizeUnit: 'px',
      textBaseline: 'top',
      textAlign: 'right',
      fontWeight: 'normal',
      openDrawer: false,
    },
  ]
}

function calcLogoSize(photoImageSize: SquareSize, logoImageSize: SquareSize, borderSize: BorderSize, logoSize: LogoSize, padding: number = 0.20): LogoSize {
  /// const bi = logoSize.height / logoSize.width;
  const contentHeight = 1 - padding * 2;

  const logoHeight = photoImageSize.width * logoSize.height;

  const newHeight = Math.floor(logoHeight * contentHeight);
  const newWidth = Math.floor(newHeight / logoImageSize.height * logoImageSize.width);

  const dx = Math.floor(borderSize.left + photoImageSize.width / 2 - newWidth / 2);
  const dy = Math.floor(borderSize.top + photoImageSize.height + logoHeight * padding);

  return {
    height: newHeight || 0,
    width: newWidth || 0,
    x: dx || 0,
    y: dy || 0,
  }
}

/**
 * 根据图像宽高计算预设配置的配置结果
 * @param config 预设配置
 * @param photoImageSize 照片宽度、高度
 * @param logoImageSize LOGO宽度、高度
 * @param useTemplate 是否是预设配置
 */
function getConfigType(config: ConfigTypeTemplate, photoImageSize: SquareSize, logoImageSize: SquareSize, useTemplate: boolean): ConfigType {
  const { width, height } = photoImageSize;
  const newConfig = { ...config };
  if (useTemplate) {
    const theBorder = {
      left: Math.floor(width * config.border.left),
      top: Math.floor(width * config.border.top),
      right: Math.floor(width * config.border.right),
      bottom: Math.floor(width * config.border.bottom),
    };
    const fontSizeBase = width * config.fontSize;
    newConfig.textItems = config.textItems.map(item => {
      return {
        ...item,
        x: theBorder.left + Math.floor(width * item.x),
        y: theBorder.top + Math.floor(fontSizeBase * item.y) + height,
        fontSize: Math.floor(fontSizeBase * item.fontSize),
      };
    });
    newConfig.logo = calcLogoSize(photoImageSize, logoImageSize, theBorder, newConfig.logo);
    newConfig.border = {
      left: theBorder.left + Math.floor(width * config.padding.left),
      top: theBorder.top + Math.floor(width * config.padding.top),
      right: theBorder.right + Math.floor(width * config.padding.right),
      bottom: theBorder.bottom + Math.floor(width * config.padding.bottom),
    };
  }
  return newConfig
}

const defaultFormValue: ConfigType = {
  logo: {
    height: 0,
    width: 0,
    x: 0,
    y: 0
  },
  textItems: [],
  background: '#fff',
  border: {
    left: 0,
    top: 0,
    right: 0,
    bottom: 0
  }
};

const ImageWatermarkValues: Record<number, ConfigTypeTemplate> = {
  0: c0,
  1: c1,
  2: c2,
}
const ImageWatermarkStyles = [
  {
    title: '预设1',
    description: '底部边框',
    value: 1,
  },
  {
    title: '预设2',
    description: '全部边框',
    value: 2,
  },
  {
    title: '无水印',
    description: '无边框无水印',
    value: 0,
  },
]

const HomePage: React.FC = () => {
  const { name } = useModel('global');
  const formRef = useRef<FormInstance>();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [config, setConfig] = useState<ConfigType>({ ...defaultFormValue });
  const [selectLogo, setSelectLogo] = useState<CheckGroupValueType>(undefined);
  const [style, setStyle] = useState<CheckGroupValueType>(0);

  const {
    filename,
    photoImage,
    logoImage,
    photoSize,
    logoSize,
    setPhotoImage,
    setLogoImage,
    exifInfo,
    exifBytes,
    loading: loading1
  } = useImage();
  const {
    canvasSize,
    downloadImage,
    previewImage,
    loading: loading2
  } = useImageWatermark({ photoImage, logoImage, canvas: canvasRef.current, exifInfo, filename, config, exifBytes });

  useEffect(() => {
    if (isNil(exifInfo)) {
      return;
    }
    switch (exifInfo.相机品牌.toLowerCase()) {
      case 'sony':
        setLogoImage(logoSony);
        break;
      case 'canon':
        setLogoImage(logoCanon);
        break;
      case 'nikon':
        setLogoImage(logoNikon);
        break;
    }
  }, [exifInfo]);
  useEffect(() => {
    if (isNil(logoImage)) {
      setSelectLogo(undefined);
      return;
    }
    setSelectLogo(logoImage.src);
  }, [logoImage]);

  useEffect(() => {
    // 获取预设配置
    const c = typeof style === 'number' ? ImageWatermarkValues[style] : c1;

    const configType = getConfigType(c, photoSize, logoSize, true);
    formRef.current?.setFieldsValue?.(configType);
    setConfig(configType);
  }, [photoSize, logoSize, style]);

  const isWeXinBrowser = useMemo(() => {
    return navigator.userAgent.includes('Weixin') || navigator.userAgent.includes('WeChat');
  }, []);

  const loading = useMemo(() => loading1 || loading2, [loading1, loading2]);

  const disableBtn = useMemo(() => isNil(photoImage), [photoImage]);

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
        <ProCard ghost gutter={20}>
          <ProCard ghost>
            <ActionButton
              onPhotoChange={setPhotoImage}
              onLogoChange={setLogoImage}
              onDownloadImage={downloadImage}
              onPreviewImage={previewImage}
              disabled={disableBtn}
            />
            <div className={styles.canvasBox}>
              <canvas ref={canvasRef} style={{ maxWidth: '100%', maxHeight: '100%' }}></canvas>
            </div>
            {
              isWeXinBrowser &&
              <Alert message="微信浏览器无法保存图片，请点击右上角用浏览器访问"
                     type="warning"
                     style={{ marginBottom: 15 }} />

            }
          </ProCard>
          <ProCard ghost>
            <Row gutter={20}>
              <Col span={24}>
                <CheckCard.Group
                  value={selectLogo}
                  options={logos}
                  onChange={v => {
                    setSelectLogo(v);
                    setLogoImage(v ? `${v}` : undefined);
                  }}
                  size={"small"} />
              </Col>
              <Col span={24} style={{ marginBottom: 20 }}>
                <PhotoInfo exifInfo={exifInfo} photoSize={photoSize} canvasSize={canvasSize} filename={filename} />
              </Col>
              <Col span={24}>
                <CheckCard.Group
                  value={style}
                  onChange={v => setStyle(v ?? 0)}
                  options={ImageWatermarkStyles}
                  size={"small"} />
              </Col>
              <Col span={24}>
                <ProCard>
                  <PhotoConfigForm defaultValue={{ ...defaultFormValue }} onChange={setConfig} formRef={formRef} />
                </ProCard>
              </Col>
            </Row>
          </ProCard>
        </ProCard>
      </Spin>
    </PageContainer>
  );
};

export default HomePage;
