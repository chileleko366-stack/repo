import './index.css';
import { Composition } from 'remotion';

// Placeholder — channel-specific compositions are registered in S8-S13.
// All Shorts are 1080x1920 (9:16) at 30fps.
export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="DopamineStudios"
        component={() => (
          <div style={{ background: '#16121f', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#d400ff', fontFamily: 'monospace', fontSize: 40 }}>Dopamine Studios</span>
          </div>
        )}
        durationInFrames={540}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};
