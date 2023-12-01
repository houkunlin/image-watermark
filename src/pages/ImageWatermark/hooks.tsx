import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BorderSize,
  ConfigType,
  drawTextItems,
  ExifInfo,
  getExifInfo,
  getTextFontStr,
  getTextStr,
  LogoSize,
  resetCanvas,
  SquareSize,
  TextConfig
} from "../Home/commons";
import type { UploadFile } from "antd";
import { isNil } from "lodash";
import { useBoolean, useDebounceFn, useMemoizedFn, useWhyDidYouUpdate } from "ahooks";
import { downloadBlob } from "@/utils";
import { getEXIF, getSegments, insertEXIF } from "@/pages/ImageWatermark/exif";

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
  const [photoSize, setPhotoSize] = useState<SquareSize>({ height: 0, width: 0 });
  const [logoSize, setLogoSize] = useState<SquareSize>({ height: 0, width: 0 });
  const [filename, setFilename] = useState<string>('保存图片');
  const [exifBytes, setExifBytes] = useState<number[]>(() => ([]));

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
    const name = loadImage(image, image1 => {
      setPhotoImage(image1);
      setPhotoSize({
        width: image1?.naturalWidth ?? 0,
        height: image1?.naturalHeight ?? 0,
      });
    });
    setFilename(isNil(name) ? '保存图片' : name);
    return name;
  })
  const setLogoImage1 = useMemoizedFn((image?: ImageType) => {
    revokeImage(logoImage);
    loadImage(image, image1 => {
      setLogoImage(image1);
      setLogoSize({
        width: image1?.naturalWidth ?? 0,
        height: image1?.naturalHeight ?? 0,
      });
    });
  })

  useEffect(() => {
    if (isNil(photoImage)) {
      setExifInfo({ ...defaultExifInfo });
      setExifBytes([]);
      return;
    }
    startLoading();
    getExifInfo(photoImage).then(setExifInfo).finally(stopLoading);

    if (photoImage.src.startsWith('blob:')) {
      fetch(photoImage.src)
        .then(res => res.arrayBuffer())
        .then(getSegments)
        .then(getEXIF)
        .then(setExifBytes);
    }
  }, [photoImage]);

  return {
    filename,
    photoImage,
    logoImage,
    photoSize,
    logoSize,
    loading,
    exifInfo,
    exifBytes,
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
  exifBytes: number[];
}

const fileType: Record<string, string> = { jpg: 'image/jpeg', png: 'image/png', };

export function useImageWatermark(props: UseImageWatermarkProps) {
  const [loading, { setTrue: startLoading, setFalse: stopLoading }] = useBoolean(false);
  const [loading1, setLoading1] = useState(false);
  const [canvasSize, setCanvasSize] = useState<SquareSize>({ height: 0, width: 0 });
  // const [borderSize, setBorderSize] = useState<BorderSize>({ bottom: 0, left: 0, right: 0, top: 0 });

  const {
    photoImage,
    logoImage,
    canvas,
    exifInfo,
    exifBytes,
    filename,
    config,
  } = props;

  const context = useMemo<CanvasRenderingContext2D | null | undefined>(() => canvas?.getContext('2d'), [canvas]);

  const saveBorderAndCanvasSize = useCallback((theBorderSize: BorderSize, photoImage?: HTMLImageElement | null, logoImage?: HTMLImageElement | null) => {
    const thePhotoSize: SquareSize = {
      width: photoImage?.naturalWidth ?? 0,
      height: photoImage?.naturalHeight ?? 0,
    };
    // setBorderSize({ ...theBorderSize });

    const theCanvasSize: SquareSize = {
      width: thePhotoSize.width + theBorderSize.left + theBorderSize.right,
      height: thePhotoSize.height + theBorderSize.top + theBorderSize.bottom,
    }
    setCanvasSize(theCanvasSize);

    const theLogoSize: SquareSize = {
      width: logoImage?.naturalWidth ?? 0,
      height: logoImage?.naturalHeight ?? 0,
    };

    return {
      photoSize: thePhotoSize,
      logoSize: theLogoSize,
      borderSize: theBorderSize,
      canvasSize: theCanvasSize,
    }
  }, []);

  const drawImage = useCallback(async (photoImageSize: SquareSize, borderSize: BorderSize) => {
    if (isNil(photoImage) || isNil(canvas) || isNil(context)) {
      return;
    }
    context.drawImage(photoImage,
      0, 0,
      photoImageSize.width, photoImageSize.height,
      borderSize.left, borderSize.top,
      photoImageSize.width, photoImageSize.height
    );
  }, [photoImage, canvas, context]);
  const drawLogo = useCallback(async (logoImageSize: SquareSize, logoCanvasSize: LogoSize) => {
    if (isNil(logoImage) || isNil(canvas) || isNil(context)) {
      return;
    }

    console.log(`useImageWatermark
    Logo原宽高：${logoImageSize.width}*${logoImageSize.height}
    Logo新宽高：${logoCanvasSize.width}*${logoCanvasSize.height}
    Logo坐标：x=${logoCanvasSize.x}, y=${logoCanvasSize.y}
    `)

    context.drawImage(logoImage,
      0, 0,
      logoImageSize.width, logoImageSize.height,
      logoCanvasSize.x, logoCanvasSize.y,
      logoCanvasSize.width, logoCanvasSize.height);
  }, [logoImage, context, canvas]);
  const print = useCallback((photoSize: SquareSize, borderSize: BorderSize, canvasSize: SquareSize) => {
    console.log(`useImageWatermark
    图片：${photoSize.width}*${photoSize.height}
    画布：${canvasSize.width}*${canvasSize.height}
    边框：left=${borderSize.left}, top=${borderSize.top}, right=${borderSize.right}, bottom=${borderSize.bottom}
    `)
  }, []);
  const render = useCallback(async (theConfig: ConfigType) => {
    if (isNil(photoImage) || isNil(canvas) || isNil(context)) {
      if (!isNil(canvas)) {
        resetCanvas(canvas);
      }
      return;
    }

    const {
      photoSize,
      logoSize,
      borderSize,
      canvasSize
    } = saveBorderAndCanvasSize(theConfig.border, photoImage, logoImage);

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
    await drawImage(photoSize, borderSize);
    await drawLogo(logoSize, theConfig.logo);
    drawTextItems(theConfig.textItems || [], exifInfo, context);
    print(photoSize, borderSize, canvasSize);
  }, [drawImage, drawLogo, canvas, context, photoImage, logoImage, exifInfo, saveBorderAndCanvasSize, print]);
  const measureText = useCallback((text: TextConfig) => {
    if (isNil(context)) {
      return;
    }
    context.font = getTextFontStr(text);
    return context.measureText(getTextStr(text, exifInfo));
  }, [context, exifInfo]);
  const downloadImage = useCallback((ext: string = 'jpg', saveExif: boolean = true, quality: any | null = null) => {
    if (isNil(photoImage) || isNil(canvas) || isNil(context)) {
      return;
    }
    const name = filename.substring(0, filename.lastIndexOf('.'));
    startLoading();
    canvas.toBlob(blob => {
      if (isNil(blob)) {
        stopLoading();
        return;
      }
      let promise: Promise<Blob | ArrayBuffer>;
      if (saveExif) {
        promise = insertEXIF(blob, exifBytes);
      } else {
        promise = Promise.resolve(blob);
      }
      promise.then(newBlob => {
        downloadBlob(newBlob, `${name}-watermark.${ext}`);
        stopLoading();
      });
    }, fileType[ext], quality);
  }, [filename, photoImage, canvas, context, startLoading, stopLoading, exifBytes]);
  const previewImage = useCallback(async (ext: string = 'jpg', quality: any | null = null) => {
    if (isNil(photoImage) || isNil(canvas) || isNil(context)) {
      return Promise.reject(new Error('未初始化'));
    }
    startLoading();
    return new Promise<string | undefined>(resolve => {
      canvas.toBlob(blob => {
        stopLoading();
        resolve(isNil(blob) ? undefined : URL.createObjectURL(blob));
      }, fileType[ext], quality);
    });
  }, [photoImage, canvas, context, startLoading, stopLoading]);

  const { run: redoRender } = useDebounceFn(async (theConfig: ConfigType) => {
    const start = new Date().getTime();
    startLoading();
    await render(theConfig);
    stopLoading();
    const end = new Date().getTime() - start;
    console.log('耗时', end, 'ms')
  }, { wait: 100 });

  useEffect(() => {
    redoRender(config);
  }, [photoImage, logoImage, config, exifInfo]);

  useWhyDidYouUpdate('useImageWatermark', { config, logoImage, photoImage });

  return {
    loading: loading || loading1,
    canvasSize,
    // borderSize,
    measureText,
    redoRender,
    downloadImage,
    previewImage,
  }
}
