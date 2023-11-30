import { ProCard, ProDescriptions } from "@ant-design/pro-components";
import React from "react";
import { ExifInfo, SquareSize } from "@/pages/Home/commons";

export type PhotoInfoProps = {
  exifInfo: ExifInfo;
  photoSize: SquareSize;
  canvasSize: SquareSize;
  filename: string;
}

function PhotoInfo(props: Readonly<PhotoInfoProps>) {
  const { exifInfo, photoSize, canvasSize, filename } = props;
  return (
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
      <ProDescriptions dataSource={photoSize} column={3} columns={[
        { title: '照片宽度', dataIndex: 'width', render: dom => `${dom} px` },
        { title: '照片高度', dataIndex: 'height', render: dom => `${dom} px` },
        { title: '文件名', render: () => filename },
      ]} />
      <ProDescriptions dataSource={canvasSize} column={3} columns={[
        { title: '画布宽度', dataIndex: 'width', render: dom => `${dom} px` },
        { title: '画布高度', dataIndex: 'height', render: dom => `${dom} px` },
      ]} />
    </ProCard>
  )
}

export default PhotoInfo;
