
export default class ImageLoader {
  static loadImage(srcURL) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(new Error(`ImageLoader failed to load: ${srcURL}`));
      img.src = srcURL;
    });
  }
}
