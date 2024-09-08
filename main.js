import './style.css';

import { AutoModel, AutoProcessor, env, RawImage } from '@xenova/transformers';

// Since we will download the model from the Hugging Face Hub, we can skip the local model check
env.allowLocalModels = false;

// Proxy the WASM backend to prevent the UI from freezing
env.backends.onnx.wasm.proxy = true;

// Constants
const EXAMPLE_URL = 'https://img.pddpic.com/mms-material-img/2023-02-19/0124f0a6-8c4a-4571-8abe-a23fe84bf514.jpeg';

// Reference the elements that we will need
const status = document.getElementById('status');
const fileUpload = document.getElementById('upload');
const imageContainer = document.getElementById('container');
const example = document.getElementById('example');

// Load model and processor
status.textContent = '模型加载中...';

const [model, processor] = await Promise.all([
    AutoModel.from_pretrained('Xenova/modnet', {
      device: 'webgpu',
      dtype: 'fp32', // or 'fp16'
    }),
    AutoProcessor.from_pretrained('Xenova/modnet'),
  ]);

status.textContent = '模型加载完成~';

example.addEventListener('click', (e) => {
    e.preventDefault();
    predict(EXAMPLE_URL);
});

fileUpload.addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (!file) {
        return;
    }

    const reader = new FileReader();

    // Set up a callback when the file is loaded
    reader.onload = e2 => predict(e2.target.result);

    reader.readAsDataURL(file);
});

// Predict foreground of the given image
async function predict(url) {
    // Read image
    const image = await RawImage.fromURL(url);

    // Update UI
    imageContainer.innerHTML = '';
    imageContainer.style.backgroundImage = `url(${url})`;

    // Set container width and height depending on the image aspect ratio
    const ar = image.width / image.height;
    const [cw, ch] = (ar > 720 / 480) ? [720, 720 / ar] : [480 * ar, 480];
    imageContainer.style.width = `${cw}px`;
    imageContainer.style.height = `${ch}px`;

    status.textContent = 'Analysing...';

    // Preprocess image
    const { pixel_values } = await processor(image);

    // Predict alpha matte
    const { output } = await model({ input: pixel_values });

    // Resize mask back to original size
    const mask = await RawImage.fromTensor(output[0].mul(255).to('uint8')).resize(image.width, image.height);

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
    status.textContent = 'Done!';
}
