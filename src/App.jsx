import { useState, useEffect, useRef, useCallback } from 'react';
import domtoimage from 'dom-to-image';
import './App.scss';

const EXAMPLE_URL = 'https://p6.toutiaoimg.com/origin/pgc-image/57cea16e7b394721bad0ed4d3045729a?from=pc';
const COLOR_MAP = {
  white: '#ffffff',
  red: '#960013',
  blue: '#3855c0',
  none: `url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQBAMAAADt3eJSAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAGUExURb+/v////5nD/3QAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAUSURBVBjTYwABQSCglEENMxgYGAAynwRB8BEAgQAAAABJRU5ErkJggg==")`
};

function App() {
  const [status, setStatus] = useState('模型加载中...');
  const [image, setImage] = useState(null);
  const [backgroundColor, setBackgroundColor] = useState(COLOR_MAP.none);
  const workerRef = useRef(null);

  useEffect(() => {
    if (workerRef.current) {
      return;
    }

    workerRef.current = new Worker(new URL('./modelWorker.js', import.meta.url), { type: 'module' });

    workerRef.current.onmessage = (event) => {
      if (event.data.type === 'modelLoaded') {
        setStatus('模型加载完成~');
      } else if (event.data.type === 'error') {
        console.error('错误:', event.data.error);
        setStatus('发生错误');
      } else if (event.data.type === 'processedImage') {
        setImage(event.data.image);
        setStatus('完成!');
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
    workerRef.current.postMessage({ type: 'predict', url });
  }, []);

  const handleFileUpload = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e2) => predict(e2.target.result);
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

  const handleBackgroundChange = useCallback((color) => {
    setBackgroundColor(COLOR_MAP[color]);
  }, []);

  return (
    <div className="App">
      <h1>图像背景移除</h1>
      <p>{status}</p>
      <div>
        <input type="file" onChange={handleFileUpload} />
        <button onClick={() => predict(EXAMPLE_URL)}>使用示例图片</button>
      </div>
      <div id="imageContainer" style={{ background: backgroundColor }}>
        {image && <img src={image} alt="Processed" />}
      </div>
      <div>
        {Object.keys(COLOR_MAP).map((color) => (
          <button
            key={color}
            onClick={() => handleBackgroundChange(color)}
            style={{ backgroundColor: COLOR_MAP[color] }}
          >
            {color}
          </button>
        ))}
      </div>
      <button onClick={handleDownload}>下载图片</button>
    </div>
  );
}

export default App;