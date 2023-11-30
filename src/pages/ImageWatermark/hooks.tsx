import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ConfigType,
  ConfigTypeBorder,
  drawTextItems,
  ExifInfo,
  getExif,
  getTextFontStr,
  getTextStr,
  resetCanvas,
  SquareSize,
  TextConfig
} from "../Home/commons";
import type { UploadFile } from "antd";
import { isNil } from "lodash";
import { useBoolean, useDebounceFn, useMemoizedFn, useWhyDidYouUpdate } from "ahooks";
import { downloadBlob } from "@/utils";

type ImageType = string | HTMLImageElement | null | UploadFile;

const defaultExifInfo: ExifInfo = {
  光圈: "", 快门: "", 感光度: "", 拍摄时间: "", 焦距: "", 版权: "", 相机品牌: "", 相机型号: "", 镜头型号: ""
}

/**
 * 创建图片的访问路径
 * @param url URL地址或者Blob文件对象
 */
export function createImageUrl(url: string | Blob) {
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
export function revokeImage(image?: HTMLImageElement | null) {
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
    console.log('getImage', imgUrl.src, url,);
    const image = new Image();
    image.src = imgUrl.src;
    image.onload = () => {
      console.log('getImage 加载图片', image.naturalWidth, image.naturalHeight);
      imgUrl.revokeObjectURL();
      resolve(image);
    }
    image.onerror = (event: Event | string, source?: string, lineno?: number, colno?: number, error?: Error) => {
      console.error('getImage 图片加载失败', event, source, lineno, colno, error);
      imgUrl.revokeObjectURL();
      reject(error);
    }
  });
}

export function useImage() {
  const [loading, { setTrue: startLoading, setFalse: stopLoading }] = useBoolean(false);
  const [exifInfo, setExifInfo] = useState<ExifInfo>(() => ({ ...defaultExifInfo }));
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

export type UseImageWatermarkProps = {
  photoImage?: HTMLImageElement | null;
  logoImage?: HTMLImageElement | null;
  canvas?: HTMLCanvasElement | null;
  exifInfo: ExifInfo;
  filename: string;
  config: ConfigType;
}

export function useImageWatermark(props: UseImageWatermarkProps) {
  const [loading, { setTrue: startLoading, setFalse: stopLoading }] = useBoolean(false);
  const [imageSize, setImageSize] = useState<SquareSize>({ height: 0, width: 0 });
  const [canvasSize, setCanvasSize] = useState<SquareSize>({ height: 0, width: 0 });
  const [borderSize, setBorderSize] = useState<ConfigTypeBorder>({ bottom: 0, left: 0, right: 0, top: 0 });

  const {
    photoImage,
    logoImage,
    canvas,
    exifInfo,
    filename,
    config,
  } = props;

  const context = useMemo<CanvasRenderingContext2D | null | undefined>(() => canvas?.getContext('2d'), [canvas]);

  const saveSize = useCallback((theBorderSize: ConfigTypeBorder, photoImage?: HTMLImageElement | null) => {
    const theImageSize = {
      width: photoImage?.naturalWidth ?? 0,
      height: photoImage?.naturalHeight ?? 0,
    };
    setBorderSize({ ...theBorderSize });
    const theCanvasSize = {
      width: theImageSize.width + theBorderSize.left + theBorderSize.right,
      height: theImageSize.height + theBorderSize.top + theBorderSize.bottom,
    }
    setCanvasSize(theCanvasSize);
    return {
      imageSize: theImageSize,
      borderSize: theBorderSize,
      canvasSize: theCanvasSize,
    }
  }, []);

  const drawImage = useCallback(async (imageSize: SquareSize, borderSize: ConfigTypeBorder) => {
    if (isNil(photoImage) || isNil(canvas) || isNil(context)) {
      return;
    }
    context.drawImage(photoImage,
      0, 0,
      imageSize.width, imageSize.height,
      borderSize.left, borderSize.top,
      imageSize.width, imageSize.height
    );
  }, [photoImage, canvas, context]);
  const drawLogo = useCallback(async (imageSize: SquareSize, borderSize: ConfigTypeBorder, padding: number = 0.20) => {
    if (isNil(logoImage) || isNil(canvas) || isNil(context)) {
      return;
    }
    const width = logoImage.naturalWidth;
    const height = logoImage.naturalHeight;
    const bi = height / width;

    const newHeight = Math.floor(borderSize.bottom * (1 - padding * 2));
    const newWidth = Math.floor(newHeight / height * width);

    console.log(`useImageWatermark
    Logo原宽高：${width}*${height}
    Logo新宽高：${newWidth}*${newHeight}
    Logo坐标：x=${imageSize.width / 2 - newWidth / 2}, y=${imageSize.height + borderSize.bottom * padding}
    `)

    const dx = borderSize.left + imageSize.width / 2 - newWidth / 2;
    const dy = borderSize.top + imageSize.height + borderSize.bottom * padding;

    context.drawImage(logoImage,
      0, 0,
      width, height,
      dx, dy,
      newWidth, newHeight);
  }, [logoImage, context, canvas]);
  const print = useCallback((imageSize: SquareSize, borderSize: ConfigTypeBorder, canvasSize: SquareSize) => {
    console.log(`useImageWatermark
    图片：${imageSize.width}*${imageSize.height}
    画布：${canvasSize.width}*${canvasSize.height}
    边框：left=${borderSize.left}, top=${borderSize.top}, right=${borderSize.right}, bottom=${borderSize.bottom}
    `)
  }, []);
  const render = useCallback(async (theConfig?: ConfigType) => {
    if (isNil(photoImage) || isNil(canvas) || isNil(context)) {
      return;
    }
    if (isNil(theConfig)) {
      theConfig = config;
    }

    const { imageSize, borderSize, canvasSize } = saveSize(theConfig.border, photoImage);

    console.log('useImageWatermark render', theConfig)

    let background;
    if (typeof theConfig?.background === 'string') {
      background = theConfig.background;
    } else if (theConfig?.background?.toHexString) {
      background = theConfig.background.toHexString();
    } else {
      background = '#fff';
    }

    resetCanvas(canvas, context, canvasSize, background);
    await drawImage(imageSize, borderSize);
    await drawLogo(imageSize, borderSize);
    drawTextItems(theConfig.textItems || [], exifInfo, context);
    print(imageSize, borderSize, canvasSize);
  }, [drawImage, drawLogo, canvas, context, photoImage, exifInfo, config, saveSize, print]);
  const measureText = useCallback((text: TextConfig) => {
    if (isNil(context)) {
      return;
    }
    context.font = getTextFontStr(text);
    return context.measureText(getTextStr(text, exifInfo));
  }, [context, exifInfo]);
  const downloadImage = useCallback((ext: string = 'jpg', quality: any | null = null) => {
    if (isNil(photoImage) || isNil(canvas) || isNil(context)) {
      return;
    }
    const name = filename.substring(0, filename.lastIndexOf('.'));
    startLoading();
    const fileType: Record<string, string> = { jpg: 'image/jpeg', png: 'image/png', };
    canvas.toBlob(blob => {
      downloadBlob(blob!, `${name}-watermark.${ext}`);
      stopLoading();
    }, fileType[ext], quality);
  }, [filename, photoImage, canvas, context, startLoading, stopLoading]);

  const { run: redoRender } = useDebounceFn(async (theConfig?: ConfigType) => {
    startLoading();
    await render(theConfig);
    stopLoading();
  }, { wait: 100 });

  useEffect(() => {
    if (!isNil(canvas)) {
      resetCanvas(canvas);
    }
    const { imageSize } = saveSize({ bottom: 0, left: 0, right: 0, top: 0 }, photoImage);
    setImageSize({ ...imageSize });
    redoRender();
  }, [photoImage]);
  useEffect(() => {
    redoRender(config);
  }, [config, logoImage]);
  useWhyDidYouUpdate('useImageWatermark', { config, logoImage, photoImage });
  return {
    loading,
    photoImageSize: imageSize,
    canvasSize,
    borderSize,
    measureText,
    redoRender,
    downloadImage,
  }
}
