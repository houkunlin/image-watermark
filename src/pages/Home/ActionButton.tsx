import { Button, Flex, Image as RcImage, Space, Upload, UploadFile } from "antd";
import { UploadChangeParam } from "antd/lib/upload/interface";
import { DownloadOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons";
import React, { useState } from "react";
import { css } from "@emotion/css";

type ActionButtonProps = {
  onPhotoChange: (file: UploadFile) => void;
  onLogoChange: (file: UploadFile) => void;
  onDownloadImage: (ext: 'jpg' | 'png', saveExif: boolean, quality?: any | null) => void;
  onPreviewImage: (ext: 'jpg' | 'png', quality?: any | null) => Promise<string | undefined>;
  disabled: boolean;
}

function ActionButton(props: Readonly<ActionButtonProps>) {
  const [imagePreviewSrc, setImagePreviewSrc] = useState<string | undefined>(undefined);
  const { disabled, onPhotoChange, onLogoChange, onDownloadImage, onPreviewImage } = props;

  const btnCss = css({
    minWidth: '102px',
    height: '102px',
    marginRight: '8px',
    marginBottom: '8px',
  });

  return (
    <>
      <Flex>
        <Space>
          <Upload
            listType="picture-card"
            showUploadList={false}
            onChange={(info: UploadChangeParam) => onPhotoChange(info.fileList[0])}
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
            onChange={(info: UploadChangeParam) => onLogoChange(info.fileList[0])}
            beforeUpload={() => false}
            maxCount={1}
          >
            <div>
              <PlusOutlined />
              <div style={{ marginTop: 8 }}>选择LOGO文件</div>
            </div>
          </Upload>
          <Button type={'dashed'} onClick={() => onDownloadImage('jpg', true)} disabled={disabled} className={btnCss}>
            <DownloadOutlined />
            <br />
            保存图片(JPG)
            <br />
            有 EXIF
          </Button>
          <Button type={'dashed'} onClick={() => onDownloadImage('jpg', false)} disabled={disabled}
                  className={btnCss}>
            <DownloadOutlined />
            <br />
            保存图片(JPG)
            <br />
            无 EXIF
          </Button>
          <Button type={'dashed'} onClick={() => onDownloadImage('png', false)} disabled={disabled}
                  className={btnCss}>
            <DownloadOutlined />
            <br />
            保存图片(PNG)
            <br />
            无 EXIF
          </Button>
          <Button type={'dashed'} onClick={() => onPreviewImage('jpg').then(setImagePreviewSrc)} disabled={disabled}
                  className={btnCss}>
            <SearchOutlined />
            <br />
            预览结果
            <br />
            大图
          </Button>
        </Space>
      </Flex>
      <RcImage
        src={''}
        style={{ display: 'none' }}
        preview={{
          visible: imagePreviewSrc !== undefined,
          onVisibleChange: (visible) => {
            if (visible) {
              /// previewImage('jpg').then(setImagePreviewSrc);
            } else {
              if (imagePreviewSrc?.startsWith('blob:')) {
                URL.revokeObjectURL(imagePreviewSrc);
              }
              setImagePreviewSrc(undefined);
            }
          },
          scaleStep: 0.2,
          minScale: 0.5,
          src: imagePreviewSrc,
        }}
      />
    </>
  )
}

export default ActionButton;
