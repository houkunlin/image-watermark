// ImageExifInfo(相机品牌 = SONY, 相机型号 = ILCE-7RM3A, 镜头型号 = FE 24-105mm F4 G OSS, 版权 = houkunlin, 拍摄时间 = 2021-07-24 19:50:17, 光圈 = f/4, 快门 = 1/40 s, 焦距 = 105 mm, 感光度 = 1000 )
// ImageExifInfo(相机品牌 = SONY, 相机型号 = ILCE-7RM3A, 镜头型号 = FE 24-105mm F4 G OSS, 版权 = houkunlin, 拍摄时间 = 2022-07-01 19:18:47, 光圈 = f/8, 快门 = 1/200 s, 焦距 = 105 mm, 感光度 = 200 )

import { Color } from "antd/lib/color-picker";
import handlebars from "handlebars";
import * as math from "mathjs";
import exif from "exif-js";
import moment from "moment/moment";

export type ImageExifInfo = {
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


export interface TextConfigType {
  // X 坐标
  x: number,
  // Y 坐标
  y: number,
  // 文字颜色
  bg: string | Color,
  // 文字大小
  fontSize: number,
  // 文字大小单位
  fontSizeUnit: 'em' | 'pt' | 'px' | 'rem' | 'in',
  // 文字模板内容
  textTpl: string,
  // 文字基线
  textBaseline: CanvasTextBaseline,
  // 文字对齐
  textAlign: CanvasTextAlign,
  // 文字粗细
  fontWeight: 'normal' | 'bold' | 'bolder' | 'lighter',
  // 文字字体内容
  getFontStr: () => string,
  // 文字目标内容渲染
  getTextStr: (imageExifInfo: ImageExifInfo) => string,
  // 是否显示弹窗配置
  openDrawer: boolean,
}


export type ConfigType = {
  items: TextConfigType[];
  bg: string | Color;
}

export class TextConfig implements TextConfigType {
  x: number;
  y: number;
  bg: string | Color;
  fontSize: number;
  fontSizeUnit: 'em' | 'pt' | 'px' | 'rem' | 'in';
  textTpl: string;
  textBaseline: CanvasTextBaseline;
  textAlign: CanvasTextAlign;
  fontWeight: 'normal' | 'bold' | 'bolder' | 'lighter';

  openDrawer: boolean = false;

  constructor(config: TextConfigType) {
    this.x = config.x;
    this.y = config.y;
    this.bg = config.bg;
    this.fontSize = config.fontSize;
    this.fontSizeUnit = config.fontSizeUnit;
    this.textTpl = config.textTpl;
    this.textBaseline = config.textBaseline;
    this.textAlign = config.textAlign;
    this.fontWeight = config.fontWeight;
  }

  public getFontStr() {
    return `${this.fontWeight} ${this.fontSize}${this.fontSizeUnit} Consolas`;
  }

  public getTextStr(imageExifInfo: ImageExifInfo) {
    try {
      return handlebars.compile(this.textTpl)(imageExifInfo)
    } catch (e) {
      return this.textTpl;
    }
  }
}

export class CanvasConfig {
  el: {
    image: HTMLImageElement,
    canvas: HTMLCanvasElement,
    context: CanvasRenderingContext2D,
  };
  image: { width: number, height: number; };
  canvas: { width: number, height: number; };
  border: { left: number, top: number, right: number; bottom: number; };
  borderPercentage: { left: number, top: number, right: number; bottom: number; };
  ready: boolean;

  constructor(imageElement: HTMLImageElement | null, canvas: HTMLCanvasElement | null, config: any) {
    this.ready = !(imageElement == null || canvas == null);
    this.el = {
      image: imageElement ? imageElement : {} as HTMLImageElement,
      canvas: canvas ? canvas : {} as HTMLCanvasElement,
      context: canvas ? canvas.getContext('2d')! : {} as CanvasRenderingContext2D,
    };
    this.image = { width: imageElement?.naturalWidth ?? 0, height: imageElement?.naturalHeight ?? 0, };
    this.borderPercentage = config.borderPercentage;
    this.border = {
      left: Math.floor(this.image.width * this.borderPercentage.left),
      top: Math.floor(this.image.width * this.borderPercentage.top),
      right: Math.floor(this.image.width * this.borderPercentage.right),
      bottom: Math.floor(this.image.width * this.borderPercentage.bottom),
    };
    this.canvas = {
      width: this.image.width + this.border.left + this.border.right,
      height: this.image.height + this.border.top + this.border.bottom,
    };
  }

  public initCanvas(fillStyle: string = '#fff') {
    this.el.canvas.width = this.canvas.width;
    this.el.canvas.height = this.canvas.height;

    this.el.context.fillStyle = fillStyle;
    this.el.context.rect(0, 0, this.canvas.width, this.canvas.height);
    this.el.context.fill();
  }

  public async drawImage() {
    this.el.context.drawImage(await createImageBitmap(this.el.image),
      0, 0,
      this.image.width, this.image.height,
      this.border.left, this.border.top,
      this.image.width, this.image.height
    );
  }

  public drawLogo(logoImage: HTMLImageElement | null, padding: number = 0.20) {
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

    context.drawImage(logoImage, 0, 0, width, height, (this.image.width / 2 - newWidth / 2), (this.image.height + this.border.bottom * padding), newWidth, newHeight);
  }

  public drawTexts(texts: TextConfigType[], imageExifInfo: ImageExifInfo) {
    const context = this.el.context;
    for (let item of texts) {
      context.font = item.getFontStr();
      context.textAlign = item.textAlign;
      context.textBaseline = item.textBaseline;
      context.fillStyle = typeof item.bg === 'string' ? item.bg : item.bg.toHexString();
      context.fillText(item.getTextStr(imageExifInfo), item.x, item.y);
    }
  }

  public async render(fillStyle: string = '#fff', logoImage: HTMLImageElement | null, texts: TextConfigType[] = [], imageExifInfo: ImageExifInfo) {
    if (!this.ready) {
      return;
    }
    this.initCanvas(fillStyle);
    await this.drawImage();
    this.drawLogo(logoImage);
    this.drawTexts(texts, imageExifInfo);
  }

  public print() {
    console.log(`
    图片：${this.image.width}*${this.image.height}
    画布：${this.canvas.width}*${this.canvas.height}
    边框：left=${this.border.left}, top=${this.border.top}, right=${this.border.right}, bottom=${this.border.bottom}
    边框比例：left=${this.borderPercentage.left}, top=${this.borderPercentage.top}, right=${this.borderPercentage.right}, bottom=${this.borderPercentage.bottom}
    `)
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

export function getExif(img: any): Promise<ImageExifInfo> {
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
