import { useState, useEffect, useRef, useCallback } from 'react';
import domtoimage from 'dom-to-image';
import './App.scss';

const COLOR_MAP = {
  white: '#ffffff',
  red: '#960013',
  blue: '#3855c0',
  none: `url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQBAMAAADt3eJSAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAGUExURb+/v////5nD/3QAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAUSURBVBjTYwABQSCglEENMxgYGAAynwRB8BEAgQAAAABJRU5ErkJggg==")`
};

function App() {
  const [status, setStatus] = useState('模型加载中...');
  const [image, setImage] = useState({ original: null, processed: null });
  const [backgroundColor, setBackgroundColor] = useState(COLOR_MAP.none);
  const workerRef = useRef(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isModelLoaded, setIsModelLoaded] = useState(false);

  useEffect(() => {
    if (workerRef.current) return;

    workerRef.current = new Worker(new URL('./modelWorker.js', import.meta.url), { type: 'module' });

    workerRef.current.onmessage = (event) => {
      if (event.data.type === 'modelLoaded') {
        setStatus('模型加载完成~');
        setIsModelLoaded(true);
      } else if (event.data.type === 'error') {
        console.error('错误:', event.data.error);
        setStatus('发生错误');
        setIsProcessing(false);
      } else if (event.data.type === 'processedImage') {
        setImage(prev => ({ ...prev, processed: event.data.image }));
        setStatus('完成!');
        setIsProcessing(false);
      }
    };

    workerRef.current.postMessage({ type: 'loadModel' });

    return () => {
      workerRef.current.terminate();
      workerRef.current = null;
    };
  }, []);

  const predict = useCallback(async (url) => {
    if (!workerRef.current) {
      setStatus('Worker 尚未准备就绪');
      return;
    }
    setStatus('处理中...');
    setIsProcessing(true);
    workerRef.current.postMessage({ type: 'predict', url });
  }, []);

  const handleFileUpload = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e2) => {
      setImage(prev => ({ ...prev, original: e2.target.result }));
      predict(e2.target.result);
    };
    reader.readAsDataURL(file);
  }, [predict]);

  const handleDownload = useCallback(() => {
    const node = document.getElementById('imageContainer');
    domtoimage.toPng(node).then(function (dataUrl) {
      const link = document.createElement('a');
      link.download = 'processed-image.png';
      link.href = dataUrl;
      link.click();
    });
  }, []);

  const handleReset = useCallback(() => {
    setImage({ original: null, processed: null });
    setBackgroundColor(COLOR_MAP.none);
    setStatus('');
  }, []);

  return (
    <div className="App">
      <p>{status}</p>
      {isModelLoaded && !image.original && (
        <div className="upload-container">
          <label htmlFor="fileInput" className="upload-button">
            上传图片
            <input
              id="fileInput"
              type="file"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      )}
      {image.original && (
        <div className="image-wrapper">
          <div id="imageContainer" style={{ background: backgroundColor }}>
            <img src={image.processed || image.original} alt="Image" />
            {isProcessing && (
              <div className="ai-loading">
                <div className="ai-loading-animation"></div>
                <div className="ai-loading-text">AI 处理中...</div>
              </div>
            )}
          </div>
          {image.processed && (
            <>
              <button className="icon-button download-button" onClick={handleDownload} title="下载图片">
                ⬇️
              </button>
              <button className="icon-button reset-button" onClick={handleReset} title="重置">
                🔄
              </button>
            </>
          )}
        </div>
      )}
      <div className="color-buttons">
        {Object.keys(COLOR_MAP).map((color) => (
          <div
            key={color}
            onClick={() => setBackgroundColor(COLOR_MAP[color])}
            className={`color-button ${color}`}
          />
        ))}
      </div>
    </div>
  );
}

export default App;