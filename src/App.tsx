import { useEffect } from 'react';
import useCutout from './hooks/useCutout';

function App() {
  const { cutout, modelLoading } = useCutout();

  useEffect(() => {
    if (modelLoading) {
      return;
    }

    const url = 'https://images.pexels.com/photos/5965592/pexels-photo-5965592.jpeg?auto=compress&cs=tinysrgb&w=1024';
    const imageData = cutout(url);
    console.log('imageData', imageData);
  }, [modelLoading, cutout])

  return (
    <div className='App'>
      <header className='App-header'>hhhhh</header>
    </div>
  );
}

export default App;
