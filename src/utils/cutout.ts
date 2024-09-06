import { AutoModel, AutoProcessor, RawImage } from '@xenova/transformers';

// Load model and processor
const [model, processor] = await Promise.all([
  AutoModel.from_pretrained('Xenova/modnet', {
    device: 'webgpu',
    dtype: 'fp32',
  }),
  AutoProcessor.from_pretrained('Xenova/modnet'),
]);

export const cutout = (url: string) => {
  // Load image from URL
  const image = await RawImage.fromURL(url);

  // Pre-process image
  const { pixel_values } = await processor(image);

  // Predict alpha matte
  const { output } = await model({ input: pixel_values });

  // Get output mask
  const mask = await RawImage.fromTensor(output[0].mul(255).to('uint8')).resize(image.width, image.height);

  // Composite the original image with the alpha matte
  const { width, height, data } = image.rgba();
  const imageData = new ImageData(new Uint8ClampedArray(data), width, height);
  for (let i = 0; i < width * height; i++) {
    const alpha = mask.data[i];
    imageData.data[i * 4 + 3] = alpha;
  }

  return imageData;
}
