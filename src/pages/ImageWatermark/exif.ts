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

  while (true) {
    if (arr[head] === 0xff && arr[head + 1] === 0xda) { // Start of Scan 0xff 0xda  SOS
      break;
    }

    if (arr[head] === 0xff && arr[head + 1] === 0xd8) { // Start of Image 0xff 0xd8  SOI
      head += 2;
    } else { // 找到每个marker
      length = arr[head + 2] * 256 + arr[head + 3]; // 每个 marker 后 的两个字节为 该marker信息的长度
      endPoint = head + length + 2;
      seg = arr.slice(head, endPoint); // 截取信息
      head = endPoint;
      segments.push(seg); // 将每个 marker + 信息 push 进去。
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
    /// throw new Error("Couldn't find APP0 marker from resized image data.");
    return data; //不是标准的JPEG文件
  }

  const app0_length = arr[4] * 256 + arr[5]; //两个字节

  const newImage = [0xff, 0xd8].concat(exifArr, arr.slice(4 + app0_length)); //合并文件 SOI + EXIF + 去除APP0的图像信息

  return new Uint8Array(newImage);
}
