import { Stage, Layer, Image as KonvaImage } from 'react-konva';
import useImage from 'use-image';
import sampleXray from './assets/sample-xray.png';

const STAGE_WIDTH = 800;
const STAGE_HEIGHT = 800;

function App() {
  const [image] = useImage(sampleXray);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
      <Stage width={STAGE_WIDTH} height={STAGE_HEIGHT} style={{ border: '1px solid #ccc' }}>
        <Layer>
          {image && (
            <KonvaImage
              image={image}
              width={STAGE_WIDTH}
              height={STAGE_HEIGHT}
            />
          )}
        </Layer>
      </Stage>
    </div>
  );
}

export default App;