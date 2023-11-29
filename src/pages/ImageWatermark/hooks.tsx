import { useCallback, useEffect, useState } from "react";
import { getExif, ImageExifInfo } from "@/pages/Home/commons";
import type { UploadFile } from "antd";
import { isNil } from "lodash";
import { useBoolean, useMemoizedFn } from "ahooks";

type ImageType = string | HTMLImageElement | null | UploadFile;

const defaultExifInfo: ImageExifInfo = {
  光圈: "", 快门: "", 感光度: "", 拍摄时间: "", 焦距: "", 版权: "", 相机品牌: "", 相机型号: "", 镜头型号: ""
}

/**
 * 创建图片的访问路径
 * @param url URL地址或者Blob文件对象
 */
function createImageUrl(url: string | Blob) {
  if (typeof url === 'string') {
    return {
      src: url,
      revokeObjectURL: () => {
      },
    };
  } else {
    const blobUrl = URL.createObjectURL(url);
    return {
      src: blobUrl,
      // 释放createObjectURL创建的对象
      revokeObjectURL: () => {
      },
      // revokeObjectURL: () => URL.revokeObjectURL(blobUrl),
    };
  }
}

/**
 * 释放图片的资源
 * @param image 图片对象
 */
function revokeImage(image?: HTMLImageElement | null) {
  if (!isNil(image)) {
    if (image.src.startsWith('blob:')) {
      URL.revokeObjectURL(image.src);
    }
    image.onload = null;
    image.onerror = null;
    image.src = '';
    image.remove();
  }
}

/**
 * 创建一个图片对象
 * @param url 图片地址或Blob文件对象
 */
export function getImage(url: string | Blob) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const imgUrl = createImageUrl(url);
    console.log('getImage', url, imgUrl)
    const image = new Image();
    image.src = imgUrl.src;
    image.onload = () => {
      console.log('加载图片', image.naturalWidth, image.naturalHeight);
      imgUrl.revokeObjectURL();
      resolve(image);
    }
    image.onerror = (event: Event | string, source?: string, lineno?: number, colno?: number, error?: Error) => {
      console.error('图片加载失败', event, source, lineno, colno, error);
      imgUrl.revokeObjectURL();
      reject(error);
    }
  });
}

export function useImageWatermark() {
  const [loading, { setTrue: startLoading, setFalse: stopLoading }] = useBoolean(false);
  const [exifInfo, setExifInfo] = useState<ImageExifInfo>(() => ({ ...defaultExifInfo }));
  const [photoImage, setPhotoImage] = useState<HTMLImageElement | null>(null);
  const [logoImage, setLogoImage] = useState<HTMLImageElement | null>(null);
  const [filename, setFilename] = useState<string>('保存图片');

  const loadImage = useCallback((url?: ImageType, callback?: (image: HTMLImageElement | null) => void) => {
    if (url instanceof HTMLImageElement) {
      callback?.(url);
      return;
    }
    if (isNil(url)) {
      callback?.(null);
      return;
    }
    startLoading();
    if (typeof url === 'string') {
      getImage(url)
        .then(callback)
        .catch(() => callback?.(null))
        .finally(stopLoading);
      return;
    }

    // const reader = new FileReader();
    // reader.readAsDataURL(url.originFileObj as Blob);
    // reader.onload = () => {
    //   console.log('readAsDataURL', reader.result as string)
    //   getImage(reader.result as string)
    //     .then(callback)
    //     .catch(() => callback?.(null))
    //     .finally(cancelLoading);
    // };

    getImage(url.originFileObj as Blob)
      .then(callback)
      .catch(() => callback?.(null))
      .finally(stopLoading);
    return url.name;
  }, [startLoading, stopLoading]);

  const setPhotoImage1 = useMemoizedFn((image?: ImageType) => {
    revokeImage(logoImage);
    const name = loadImage(image, setPhotoImage);
    setFilename(isNil(name) ? '保存图片' : name);
    return name;
  })
  const setLogoImage1 = useMemoizedFn((image?: ImageType) => {
    revokeImage(logoImage);
    loadImage(image, setLogoImage);
  })

  useEffect(() => {
    if (isNil(photoImage)) {
      setExifInfo({ ...defaultExifInfo });
      return;
    }
    startLoading();
    getExif(photoImage).then(setExifInfo).finally(stopLoading);
  }, [photoImage]);

  return {
    filename,
    photoImage,
    logoImage,
    loading,
    exifInfo,
    loadImage,
    setPhotoImage: setPhotoImage1,
    setLogoImage: setLogoImage1,
  }
}
