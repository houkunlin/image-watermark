
/**
 * 把 Blob 数据通过文件形式下载保存
 * @see https://umijs.org/zh-CN/plugins/plugin-request
 * @param blobParts 文件数据
 * @param filename 文件名
 */
export const downloadBlob = (blobParts: BlobPart, filename: string) => {
  // 将二进制流转为blob
  const blob = new Blob([blobParts], { type: 'application/octet-stream' });
  // @ts-ignore
  if (typeof window.navigator.msSaveBlob !== 'undefined') {
    // 兼容IE，window.navigator.msSaveBlob：以本地方式保存文件
    // @ts-ignore
    window.navigator.msSaveBlob(blob, decodeURI(filename));
  } else {
    // 创建新的URL并指向File对象或者Blob对象的地址
    const blobURL = window.URL.createObjectURL(blob);
    // 创建a标签，用于跳转至下载链接
    const tempLink = document.createElement('a');
    tempLink.style.display = 'none';
    tempLink.href = blobURL;
    tempLink.setAttribute('download', decodeURI(filename));
    // 兼容：某些浏览器不支持HTML5的download属性
    if (typeof tempLink.download === 'undefined') {
      tempLink.setAttribute('target', '_blank');
    }
    // 挂载a标签
    document.body.appendChild(tempLink);
    tempLink.click();
    document.body.removeChild(tempLink);
    // 释放blob URL地址
    window.URL.revokeObjectURL(blobURL);
  }
}
