import { useState, useEffect, useCallback } from 'react';
import { AutoModel, AutoProcessor, RawImage } from '@xenova/transformers';

function useCutout() {
  const [modelConfig, setModelConfig] = useState<{
    model: any;
    processor: any;
  }>();
  const [modelLoading, setModelLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [model, processor] = await Promise.all([
        AutoModel.from_pretrained('Xenova/modnet', { quantized: false }),
        AutoProcessor.from_pretrained('Xenova/modnet'),
      ]);

      setModelConfig({
        model,
        processor,
      });
      setModelLoading(false);
    })();
  }, []);

  const cutout = useCallback(
    async (url: string) => {
      if (!modelConfig) {
        return;
      }

      const { model, processor } = modelConfig;
      const image = await RawImage.fromURL(url);
      const { pixel_values } = await processor(image);

      // Predict alpha matte
      const { output } = await model({ input: pixel_values });

      // Get output mask
      const mask = await RawImage.fromTensor(
        output[0].mul(255).to('uint8')
      ).resize(image.width, image.height);

      // Composite the original image with the alpha matte
      const { width, height, data } = image.rgba();
      const imageData = new ImageData(
        new Uint8ClampedArray(data),
        width,
        height
      );
      for (let i = 0; i < width * height; i++) {
        const alpha = mask.data[i];
        imageData.data[i * 4 + 3] = alpha;
      }

      return imageData;
    },
    [modelConfig]
  );

  return {
    cutout,
    modelLoading,
  };
}

export default useCutout;
