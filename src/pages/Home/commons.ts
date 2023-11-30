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

export type ConfigTypeBorder = {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export type SquareSize = {
  width: number;
  height: number;
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
  border: ConfigTypeBorder;
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

export function clearCanvas(canvas: HTMLCanvasElement) {
  canvas.width = 0;
  canvas.height = 0;
  const context2D = canvas.getContext('2d')!;
  context2D.rect(0, 0, 0, 0);
  context2D.fill();
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

export class CanvasConfig {
  el: {
    image: HTMLImageElement,
    canvas: HTMLCanvasElement,
    context: CanvasRenderingContext2D,
  };
  image: SquareSize;
  canvas: SquareSize;
  border: ConfigTypeBorder;
  ready: boolean;

  constructor(imageElement: HTMLImageElement | null, canvas: HTMLCanvasElement | null) {
    this.ready = !(imageElement == null || canvas == null);
    this.el = {
      image: imageElement ? imageElement : {} as HTMLImageElement,
      canvas: canvas ? canvas : {} as HTMLCanvasElement,
      context: canvas ? canvas.getContext('2d')! : {} as CanvasRenderingContext2D,
    };
    this.image = { width: imageElement?.naturalWidth ?? 0, height: imageElement?.naturalHeight ?? 0, };
    this.border = { left: 0, top: 0, right: 0, bottom: 0, };
    this.canvas = {
      width: this.image.width + this.border.left + this.border.right,
      height: this.image.height + this.border.top + this.border.bottom,
    };
  }

  /**
   * 重设边框宽度
   * @param border 边框宽度
   */
  public resetBorder(border: ConfigTypeBorder) {
    this.border = { ...border };
    this.canvas = {
      width: this.image.width + this.border.left + this.border.right,
      height: this.image.height + this.border.top + this.border.bottom,
    };
  }

  public async drawImage() {
    this.el.context.drawImage(await createImageBitmap(this.el.image),
      0, 0,
      this.image.width, this.image.height,
      this.border.left, this.border.top,
      this.image.width, this.image.height
    );
  }

  public async drawLogo(logoImage: HTMLImageElement | null, padding: number = 0.20) {
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

    const dx = this.border.left + this.image.width / 2 - newWidth / 2;
    const dy = this.border.top + this.image.height + this.border.bottom * padding;

    context.drawImage(logoImage,
      0, 0,
      width, height,
      dx, dy,
      newWidth, newHeight);
  }

  public async render(logoImage: HTMLImageElement | null, config: ConfigType, exifInfo: ExifInfo) {
    if (!this.ready) {
      return;
    }
    this.resetBorder(config.border);

    console.log('render', config)

    let background;
    if (typeof config?.background === 'string') {
      background = config.background;
    } else if (config?.background?.toHexString) {
      background = config.background.toHexString();
    } else {
      background = '#fff';
    }

    resetCanvas(this.el.canvas, this.el.context, this.canvas, background);
    await this.drawImage();
    await this.drawLogo(logoImage);
    drawTextItems(config.textItems || [], exifInfo, this.el.context);
  }

  public print() {
    console.log(`
    图片：${this.image.width}*${this.image.height}
    画布：${this.canvas.width}*${this.canvas.height}
    边框：left=${this.border.left}, top=${this.border.top}, right=${this.border.right}, bottom=${this.border.bottom}
    `)
  }

  // 计算文字宽高
  public measureText(text: TextConfig, exifInfo: ExifInfo) {
    this.el.context.font = getTextFontStr(text);
    return this.el.context.measureText(getTextStr(text, exifInfo));
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
