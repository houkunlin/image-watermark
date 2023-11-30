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
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Button, Col, Divider, Modal, Row, Space, Spin, Upload } from 'antd';
import { DownloadOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { UploadChangeParam } from "antd/lib/upload/interface";
import { useDebounceFn } from 'ahooks';
import { ConfigType, TextConfig } from "./commons";
import { useImage, useImageWatermark } from "../ImageWatermark/hooks";
import { isNil } from "lodash";
import { CheckGroupValueType } from "@ant-design/pro-card/es/components/CheckCard/Group";

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

// 无预设配置
const c0: ConfigType = {
  background: '#fff',
  border: { left: 0, top: 0, right: 0, bottom: 0 },
  textItems: [
    {
      textTpl: '©{{版权}}',
      x: 1,
      y: 1,
      color: '#fff',
      fontSize: 1,
      fontSizeUnit: 'px',
      textBaseline: 'bottom',
      textAlign: 'right',
      fontWeight: 'bolder',
      openDrawer: false,
    },
  ]
}
// 预设配置1
const c1: ConfigType = {
  background: '#fff',
  border: { left: 0, top: 0, right: 0, bottom: 0.08 },
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
const c2: ConfigType = {
  background: '#fff',
  border: { left: 0.08, top: 0.08, right: 0.08, bottom: 0.08 },
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

/**
 * 根据图像宽高计算预设配置的配置结果
 * @param config 预设配置
 * @param width 图像宽度
 * @param height 图像高度
 * @param useTemplate 是否是预设配置
 */
function getConfigType(config: ConfigType, width: number, height: number, useTemplate: boolean): ConfigType {
  const newConfig = { ...config };
  if (useTemplate) {
    newConfig.border = {
      left: Math.floor(width * config.border.left),
      top: Math.floor(width * config.border.top),
      right: Math.floor(width * config.border.right),
      bottom: Math.floor(width * config.border.bottom),
    };
    newConfig.textItems = config.textItems.map(item => {
      const fontSize = Math.floor(newConfig.border.bottom * item.fontSize);
      return {
        ...item,
        x: newConfig.border.left + Math.floor(width * item.x),
        y: newConfig.border.top + Math.floor(newConfig.border.bottom * item.y) + height,
        fontSize: fontSize > 0 ? fontSize : Math.floor(width * 0.020),
      };
    });
  }
  return newConfig
}


const ImageWatermarkValues: Record<number, ConfigType> = {
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
  const [config, setConfig] = useState<ConfigType>({ textItems: [], background: '#fff', border: { left: 0, top: 0, right: 0, bottom: 0 } });
  const [loading1, setLoading1] = useState<boolean>(false);
  const [style, setStyle] = useState<CheckGroupValueType>(0);

  const { filename, photoImage, logoImage, setPhotoImage, setLogoImage, exifInfo, loading: loading2 } = useImage();
  const {
    photoImageSize,
    canvasSize,
    downloadImage,
    loading: loading3
  } = useImageWatermark({ photoImage, logoImage, canvas: canvasRef.current, exifInfo, filename, config });

  const { run: setConfigDebounceFn } = useDebounceFn((changedValues, values) => {
    setConfig({ ...values });
  }, { wait: 200 });

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
    const image = photoImageSize;
    const c = typeof style === 'number' ? ImageWatermarkValues[style] : c1

    const configType = getConfigType(c, image.width, image.height, true);
    formRef.current?.setFieldsValue?.(configType);
    setConfig(configType);
  }, [photoImageSize, style]);

  const isWeXinBrowser = useMemo(() => {
    return navigator.userAgent.includes('Weixin') || navigator.userAgent.includes('WeChat');
  }, []);

  const loading = useMemo(() => loading1 || loading2 || loading3, [loading1, loading2, loading3]);

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
            <Space>
              <Upload
                listType="picture-card"
                showUploadList={false}
                onChange={(info: UploadChangeParam) => setPhotoImage(info.fileList[0])}
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
                onChange={(info: UploadChangeParam) => setLogoImage(info.fileList[0])}
                beforeUpload={() => false}
                maxCount={1}
              >
                <div>
                  <PlusOutlined />
                  <div style={{ marginTop: 8 }}>选择LOGO文件</div>
                </div>
              </Upload>
              <Space.Compact>
                <Button onClick={() => downloadImage('jpg')}><DownloadOutlined /> 保存图片 ( JPG )</Button>
                <Button onClick={() => downloadImage('png')}><DownloadOutlined /> 保存图片 ( PNG )</Button>
              </Space.Compact>
            </Space>
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
                  options={logos}
                  onChange={v => setLogoImage(v ? `${v}` : undefined)}
                  size={"small"} />
              </Col>
              <Col span={24} style={{ marginBottom: 20 }}>
                <ProCard
                  title="照片信息"
                  headerBordered
                  collapsible
                >
                  <ProDescriptions dataSource={exifInfo} column={3} columns={[
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
                  <ProDescriptions dataSource={photoImageSize} column={3} columns={[
                    { title: '照片宽度', dataIndex: 'width', render: dom => `${dom} px` },
                    { title: '照片高度', dataIndex: 'height', render: dom => `${dom} px` },
                    { title: '文件名', render: () => filename },
                  ]} />
                  <ProDescriptions dataSource={canvasSize} column={3} columns={[
                    { title: '画布宽度', dataIndex: 'width', render: dom => `${dom} px` },
                    { title: '画布高度', dataIndex: 'height', render: dom => `${dom} px` },
                  ]} />
                </ProCard>
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
                  <ProForm
                    formRef={formRef}
                    submitter={{ render: (props, dom) => null, }}
                    onValuesChange={setConfigDebounceFn}
                    request={async (params) => ({ ...config })}
                  >
                    <Divider orientation={'left'}>画布</Divider>
                    <ProFormGroup>
                      <ProFormColorPicker
                        name={'background'}
                        label={'背景颜色'}
                        fieldProps={{
                          // @ts-ignore
                          showText: (color: any) => color.toHexString(),
                          style: { display: 'inline-flex', width: "auto" },
                          format: 'hex',
                        }} />
                      <ProFormDigit name={['border', 'left']} label={'左边'} width={'xs'} addonAfter={'px'} />
                      <ProFormDigit name={['border', 'top']} label={'顶边'} width={'xs'} addonAfter={'px'} />
                      <ProFormDigit name={['border', 'right']} label={'右边'} width={'xs'} addonAfter={'px'} />
                      <ProFormDigit name={['border', 'bottom']} label={'底边'} width={'xs'} addonAfter={'px'} />
                    </ProFormGroup>
                    <Divider orientation={'left'}>文字</Divider>
                    <ProFormList<TextConfig>
                      name={'textItems'}
                      creatorButtonProps={{ creatorButtonText: '添加文字', }}
                      creatorRecord={{ ...defaultText, }}
                    >
                      {(meta, index, action, count) => {
                        const data = action.getCurrentRowData();
                        const openDrawer = data.openDrawer;
                        // console.log('ProFormList', meta, index, action, count, data);
                        return <ProFormGroup>
                          <ProFormText name={'textTpl'} label={'文字'} width={'lg'} />
                          <ProFormDigit name={'x'} label={'X坐标'} width={'xs'} addonAfter={'px'} />
                          <ProFormDigit name={'y'} label={'Y坐标'} width={'xs'} addonAfter={'px'} />
                          <ProFormItem label={'操作'}>
                            <a type={'link'}
                               onClick={() => action.setCurrentRowData({ ...data, openDrawer: !openDrawer })}>
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
                              name={'color'}
                              label={'颜色'}
                              fieldProps={{
                                // @ts-ignore
                                showText: (color: any) => color.toHexString(),
                                style: { display: 'inline-flex', width: "auto" },
                                format: 'hex',
                              }}
                            />
                          </Modal>
                        </ProFormGroup>
                      }}
                    </ProFormList>
                  </ProForm>
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
