class ImageProcessorWorker {
  constructor(onModelLoaded, onProcessed, onError) {
    this.worker = new Worker(new URL('./modelWorker.js', import.meta.url), { type: 'module' });
    this.onModelLoaded = onModelLoaded;
    this.onProcessed = onProcessed;
    this.onError = onError;

    this.worker.onmessage = this.handleMessage.bind(this);
    this.worker.onerror = this.handleError.bind(this);

    this.loadModel();
  }

  handleMessage(event) {
    const { type, image, error } = event.data;
    switch (type) {
      case 'modelLoaded':
        this.onModelLoaded();
        break;
      case 'processedImage':
        this.onProcessed(image);
        break;
      case 'error':
        this.onError(error);
        break;
      default:
        console.warn('Unknown message type:', type);
    }
  }

  handleError(error) {
    this.onError(error);
  }

  loadModel() {
    this.worker.postMessage({ type: 'loadModel' });
  }

  processImage(imageUrl) {
    this.worker.postMessage({ type: 'predict', url: imageUrl });
  }

  terminate() {
    this.worker.terminate();
  }
}

export default ImageProcessorWorker;
