import './style.css';

import { AutoModel, AutoProcessor, env, RawImage } from '@xenova/transformers';
import domtoimage from 'dom-to-image';

// Since we will download the model from the Hugging Face Hub, we can skip the local model check
env.allowLocalModels = false;

// Proxy the WASM backend to prevent the UI from freezing
env.backends.onnx.wasm.proxy = true;

// Constants
const EXAMPLE_URL =
  'https://p6.toutiaoimg.com/origin/pgc-image/57cea16e7b394721bad0ed4d3045729a?from=pc';

// Reference the elements that we will need
const status = document.getElementById('status');
const fileUpload = document.getElementById('upload');
const imageContainer = document.getElementById('container');
const example = document.getElementById('example');
const colors = document.getElementById('colors');
const colorMap = {
  white: '#ffffff',
  red: '#960013',
  blue: '#3855c0',
  none: `url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQBAMAAADt3eJSAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAGUExURb+/v////5nD/3QAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAUSURBVBjTYwABQSCglEENMxgYGAAynwRB8BEAgQAAAABJRU5ErkJggg==")`,
};

// Load model and processor
status.textContent = '模型加载中...';

const [model, processor] = await Promise.all([
  AutoModel.from_pretrained('briaai/RMBG-1.4', {
    config: { model_type: 'custom' },
  }),
  AutoProcessor.from_pretrained('briaai/RMBG-1.4', {
    config: {
      do_normalize: true,
      do_pad: false,
      do_rescale: true,
      do_resize: true,
      image_mean: [0.5, 0.5, 0.5],
      feature_extractor_type: 'ImageFeatureExtractor',
      image_std: [1, 1, 1],
      resample: 2,
      rescale_factor: 0.00392156862745098,
      size: { width: 1024, height: 1024 },
    },
  }),
]);

// const [model, processor] = await Promise.all([
//     AutoModel.from_pretrained('Xenova/modnet', {
//       device: 'webgpu',
//       dtype: 'fp32', // or 'fp16'
//     }),
//     AutoProcessor.from_pretrained('Xenova/modnet'),
//   ]);

status.textContent = '模型加载完成~';

example.addEventListener('click', (e) => {
  e.preventDefault();
  predict(EXAMPLE_URL);
});

colors.addEventListener('click', (e) => {
  e.preventDefault();
  const color = e.target.id;
  imageContainer.style.background = colorMap[color];
  download();
});

fileUpload.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) {
    return;
  }

  const reader = new FileReader();
  reader.onload = (e2) => predict(e2.target.result);
  reader.readAsDataURL(file);
});

// Predict foreground of the given image
const predict = async (url) => {
  // Read image
  const image = await RawImage.fromURL(url);

  // Update UI
  imageContainer.innerHTML = '';
  imageContainer.style.backgroundImage = `url(${url})`;

  // Set container width and height depending on the image aspect ratio
  const ar = image.width / image.height;
  const [cw, ch] = ar > 720 / 480 ? [720, 720 / ar] : [480 * ar, 480];
  imageContainer.style.width = `${cw}px`;
  imageContainer.style.height = `${ch}px`;

  status.textContent = '处理中...';

  // Preprocess image
  const { pixel_values } = await processor(image);

  // Predict alpha matte
  const { output } = await model({ input: pixel_values });

  // Resize mask back to original size
  const mask = await RawImage.fromTensor(output[0].mul(255).to('uint8')).resize(
    image.width,
    image.height
  );

  // Create new canvas
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext('2d');

  // Draw original image output to canvas
  ctx.drawImage(image.toCanvas(), 0, 0);

  // Update alpha channel
  const pixelData = ctx.getImageData(0, 0, image.width, image.height);
  for (let i = 0; i < mask.data.length; ++i) {
    pixelData.data[4 * i + 3] = mask.data[i];
  }
  ctx.putImageData(pixelData, 0, 0);

  // Update UI
  imageContainer.append(canvas);
  imageContainer.style.removeProperty('background-image');
  imageContainer.style.background = `url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQBAMAAADt3eJSAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAGUExURb+/v////5nD/3QAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAUSURBVBjTYwABQSCglEENMxgYGAAynwRB8BEAgQAAAABJRU5ErkJggg==")`;
  status.textContent = '完成!';
};

const download = (node = imageContainer) => {
  domtoimage.toPng(node).then(function (dataUrl) {
    var link = document.createElement('a');
    link.download = 'my-image-name.jpeg';
    link.href = dataUrl;
    link.click();
  });
};
