// ImageExifInfo(相机品牌 = SONY, 相机型号 = ILCE-7RM3A, 镜头型号 = FE 24-105mm F4 G OSS, 版权 = houkunlin, 拍摄时间 = 2021-07-24 19:50:17, 光圈 = f/4, 快门 = 1/40 s, 焦距 = 105 mm, 感光度 = 1000 )
// ImageExifInfo(相机品牌 = SONY, 相机型号 = ILCE-7RM3A, 镜头型号 = FE 24-105mm F4 G OSS, 版权 = houkunlin, 拍摄时间 = 2022-07-01 19:18:47, 光圈 = f/8, 快门 = 1/200 s, 焦距 = 105 mm, 感光度 = 200 )

import { Color } from "antd/lib/color-picker";
import handlebars from "handlebars";
import * as math from "mathjs";
import exif from "exif-js";
import moment from "moment/moment";
import { isNil } from "lodash";

export type ExifInfo = {
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

export interface Text {
  // X 坐标
  x: number;
  // Y 坐标
  y: number;
  // 文字颜色
  color: string | Color;
  // 文字大小
  fontSize: number;
  // 文字大小单位
  fontSizeUnit: 'em' | 'pt' | 'px' | 'rem' | 'in';
  // 文字模板内容
  textTpl: string;
  // 文字基线
  textBaseline: CanvasTextBaseline;
  // 文字对齐
  textAlign: CanvasTextAlign;
  // 文字粗细
  fontWeight: 'normal' | 'bold' | 'bolder' | 'lighter';
}

export function getTextFontStr(text: Text) {
  return `${text.fontWeight} ${text.fontSize}${text.fontSizeUnit} Consolas`;
}

export function getTextStr(text: Text, exifInfo: ExifInfo) {
  try {
    return handlebars.compile(text.textTpl)(exifInfo)
  } catch (e) {
    return text.textTpl;
  }
}

export type BorderSize = {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export type SquareSize = {
  width: number;
  height: number;
}

export type LogoSize = SquareSize & {
  x: number;
  y: number;
}

export type ConfigType = {
  // 文字列表
  textItems: TextConfig[];
  // 画布背景颜色
  background: string | Color;
  /**
   * 画布边框大小
   * @description
   */
  border: BorderSize;
  /**
   * LOGO大小
   */
  logo: LogoSize;
}

export class TextConfig implements Text {
  // X 坐标
  x: number;
  // Y 坐标
  y: number;
  // 文字颜色
  color: string | Color;
  // 文字大小
  fontSize: number;
  // 文字大小单位
  fontSizeUnit: 'em' | 'pt' | 'px' | 'rem' | 'in';
  // 文字模板内容
  textTpl: string;
  // 文字基线
  textBaseline: CanvasTextBaseline;
  // 文字对齐
  textAlign: CanvasTextAlign;
  // 文字粗细
  fontWeight: 'normal' | 'bold' | 'bolder' | 'lighter';
  // 是否显示弹窗配置
  openDrawer: boolean = false;

  constructor(config: Text) {
    this.x = config.x;
    this.y = config.y;
    this.color = config.color;
    this.fontSize = config.fontSize;
    this.fontSizeUnit = config.fontSizeUnit;
    this.textTpl = config.textTpl;
    this.textBaseline = config.textBaseline;
    this.textAlign = config.textAlign;
    this.fontWeight = config.fontWeight;
    this.openDrawer = false;
  }
}

export function resetCanvas(canvas?: HTMLCanvasElement, context?: CanvasRenderingContext2D, size?: SquareSize, fillStyle: string = '#fff') {
  if (isNil(canvas)) {
    return;
  }
  canvas.width = size?.width ?? 0;
  canvas.height = size?.height ?? 0;
  // context.clearRect(0, 0, size.width, size.height);

  if (isNil(context)) {
    context = canvas.getContext('2d')!;
  }

  context.fillStyle = fillStyle;
  context.rect(0, 0, size?.width ?? 0, size?.height ?? 0);
  context.fill();
}

export function drawTextItems(texts: TextConfig[], exifInfo: ExifInfo, context?: CanvasRenderingContext2D) {
  if (isNil(context)) {
    return;
  }
  for (const item of texts) {
    context.font = getTextFontStr(item);
    context.textAlign = item.textAlign;
    context.textBaseline = item.textBaseline;
    context.fillStyle = typeof item.color === 'string' ? item.color : item.color.toHexString();
    context.fillText(getTextStr(item, exifInfo), item.x, item.y);
  }
}

/**
 * 尝试把一个为10倍数的整数尽量缩小到100以内甚至10以内
 * @param raw 原始数值
 * @param xNum 10倍数的次数
 * @return [number, number] 0: 缩小结果值，1: 除10的次数
 */
function mod10x(raw: number, xNum: number = 1) {
  const modValue = Math.pow(10, xNum);
  let result = raw;
  let num = 0;
  while (result % modValue === 0) {
    num++;
    result /= modValue;
  }
  // console.log('mod10x', raw, xNum, [result, num]);
  return [result, num];
}

export function getFractionStr(num: number | string | Number | any, after: string = '') {
  if (num == null) {
    return '';
  }
  // console.log('getFractionStr', num)
  if (num.numerator != null && num.denominator != null) {
    // 分母为1，快慢速度为1s以上
    if (num.denominator === 1) {
      return `${num.numerator}${after}`;
    }
    // 分子为1，快慢速度为1s以下
    if (num.numerator === 1) {
      return `${num.numerator}/${num.denominator}${after}`;
    }
    if (num.denominator === num.numerator) {
      // 分子分母相等：快慢速度为1s
      return `1${after}`;
    }
    // 有遇到快慢速度为 10/1250 或 100000/2500000 的快慢速度，需要把分子缩小，分子分母约分
    if (num.numerator < num.denominator) {
      // 分子小于分母：快慢速度为1s以下
      // 分子：把分子先缩小
      const fz = mod10x(num.numerator);
      // 分母
      const fm = mod10x(num.denominator, fz[1]);
      return `${fz[0]}/${fm[0]}${after}`;
    } else {
      // 分子大于分母：快慢速度为1s以上
      // 分母：把分母先缩小
      const fm = mod10x(num.denominator);
      // 分子
      const fz = mod10x(num.numerator, fm[1]);
      if (fm[0] === 1) {
        // 分母为1：快慢速度为1s以上
        return `${fz[0]}${after}`;
      }
      return `${fz[0]}/${fm[0]}${after}`;
    }
  }
  const re = math.fraction(`${num}`);
  return `${re.n}/${re.d}${after}`;
}

/*
 * @param rawImageArray{ArrayBuffer|Array|Blob}  原始图
 * @param callback{Function} 回调函数
 * @see https://icaife.github.io/2015/05/19/js-compress-JPEG-width-exif/ 前端图片压缩并保留EXIF信息
 */
export async function getSegments(rawImage: Blob | ArrayBuffer) {
  let data: ArrayBuffer;
  if (rawImage instanceof Blob) {
    data = await rawImage.arrayBuffer();
  } else {
    data = rawImage;
  }
  let head = 0, segments: number[][] = [];
  let length: number, endPoint: number, seg: number[];
  const arr: number[] = [].slice.call(new Uint8Array(data));

  while (1) {
    if (arr[head] === 0xff && arr[head + 1] === 0xda) { //Start of Scan 0xff 0xda  SOS
      break;
    }

    if (arr[head] === 0xff && arr[head + 1] === 0xd8) { //Start of Image 0xff 0xd8  SOI
      head += 2;
    } else { //找到每个marker
      length = arr[head + 2] * 256 + arr[head + 3]; //每个marker 后 的两个字节为 该marker信息的长度
      endPoint = head + length + 2;
      seg = arr.slice(head, endPoint); //截取信息
      head = endPoint;
      segments.push(seg); //将每个marker + 信息 push 进去。
    }
    if (head > arr.length) {
      break;
    }
  }
  return segments;
}

/*
 * @param segments{Array|Uint8Array} 处理后的segments
 * @see https://icaife.github.io/2015/05/19/js-compress-JPEG-width-exif/ 前端图片压缩并保留EXIF信息
 */
export function getEXIF(segments: number[][]) {
  if (!segments.length) {
    return [];
  }
  let seg: number[] = [];
  for (const element of segments) {
    if (element[0] === 0xff && element[1] === 0xe1) { // app1 exif 0xff 0xe1
      seg = seg.concat(element);
    }
  }
  return seg;
}

/*
 * @param resizedImg{ArrayBuffer|Blob} 压缩后的图片
 * @param exifArr{Array|Uint8Array} EXIF信息数组
 * @param callback{Function} 回调函数
 * @see https://icaife.github.io/2015/05/19/js-compress-JPEG-width-exif/ 前端图片压缩并保留EXIF信息
 */
export async function insertEXIF(resizedImg: Blob | ArrayBuffer, exifArr: number[]) {
  let data: ArrayBuffer;
  if (resizedImg instanceof Blob) {
    data = await resizedImg.arrayBuffer();
  } else {
    data = resizedImg;
  }
  const arr = [].slice.call(new Uint8Array(data), 0);
  if (arr[2] !== 0xff || arr[3] !== 0xe0) {
    // throw new Error("Couldn't find APP0 marker from resized image data.");
    return data; //不是标准的JPEG文件
  }

  const app0_length = arr[4] * 256 + arr[5]; //两个字节

  const newImage = [0xff, 0xd8].concat(exifArr, arr.slice(4 + app0_length)); //合并文件 SOI + EXIF + 去除APP0的图像信息

  return new Uint8Array(newImage);
}

export function getExif(img: any): Promise<ExifInfo> {
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
      let dateTimeOriginal = getTagStr("DateTimeOriginal");
      if (dateTimeOriginal != '' && dateTimeOriginal.length === 19) {
        dateTimeOriginal = moment(dateTimeOriginal, 'YYYY:MM:DD HH:mm:ss').format('YYYY-MM-DD HH:mm:ss');
      }
      resolve({
        相机品牌: getTagStr("Make"),
        相机型号: getTagStr("Model"),
        镜头型号: getTagStr("undefined"),
        版权: getTagStr("Copyright"),
        拍摄时间: dateTimeOriginal,
        光圈: getTagStr("FNumber", 'f/'),
        快门: getFractionStr(exif.getTag(img, "ExposureTime"), 's'),
        焦距: getTagStr("FocalLength", '', 'mm'),
        感光度: getTagStr("ISOSpeedRatings"),
      });
    });
  })
}
