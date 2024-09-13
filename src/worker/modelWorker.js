import { env, AutoModel, AutoProcessor, RawImage } from '@xenova/transformers';

const MODEL_NAME = 'briaai/RMBG-1.4';
let model, processor;

self.addEventListener('message', async (event) => {
  if (event.data.type === 'loadModel') {
    try {
      env.allowLocalModels = false;
      env.backends.onnx.wasm.proxy = true;

      [model, processor] = await Promise.all([
        AutoModel.from_pretrained(MODEL_NAME, {
          config: { model_type: 'custom' },
        }),
        AutoProcessor.from_pretrained(MODEL_NAME, {
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
      self.postMessage({ type: 'modelLoaded' });
    } catch (error) {
      self.postMessage({ type: 'error', error: error.message });
    }
  }

  if (event.data.type === 'predict') {
    try {
      const img = await RawImage.fromURL(event.data.url);
      const { pixel_values } = await processor(img);
      const { output } = await model({ input: pixel_values });

      const mask = await RawImage.fromTensor(
        output[0].mul(255).to('uint8')
      ).resize(img.width, img.height);

      const canvas = new OffscreenCanvas(img.width, img.height);
      const ctx = canvas.getContext('2d');

      ctx.drawImage(img.toCanvas(), 0, 0);

      const pixelData = ctx.getImageData(0, 0, img.width, img.height);
      for (let i = 0; i < mask.data.length; ++i) {
        pixelData.data[4 * i + 3] = mask.data[i];
      }
      ctx.putImageData(pixelData, 0, 0);

      const blob = await canvas.convertToBlob();
      const processedImageUrl = URL.createObjectURL(blob);

      self.postMessage({ type: 'processedImage', image: processedImageUrl });
    } catch (error) {
      self.postMessage({ type: 'error', error: error.message });
    }
  }
});
