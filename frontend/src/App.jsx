import React from 'react';
import { ShaderGradientCanvas, ShaderGradient } from '@shadergradient/react';
import { LiquidGlassCard } from './components/LiquidGlassCard';
import { InternAgentForm } from './components/InternAgentForm';

function App() {
  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#0d0d0d]">
      <div className="absolute inset-0 z-0">
        <ShaderGradientCanvas
          style={{
            width: '100%',
            height: '100%',
          }}
          lazyLoad={undefined}
          fov={undefined}
          pixelDensity={1}
          pointerEvents="none"
        >
          <ShaderGradient
            animate="on"
            type="waterPlane"
            wireframe={false}
            shader="defaults"
            uTime={0}
            uSpeed={0.2}
            uStrength={3.4}
            uDensity={1.2}
            uFrequency={0}
            uAmplitude={0}
            positionX={0}
            positionY={0.9}
            positionZ={-0.3}
            rotationX={45}
            rotationY={0}
            rotationZ={0}
            color1="#94ffd1"
            color2="#6bf5ff"
            color3="#ffffff"
            reflection={0.1}
            cAzimuthAngle={170}
            cPolarAngle={70}
            cDistance={4.4}
            cameraZoom={1}
            lightType="3d"
            brightness={1.2}
            envPreset="city"
            grain="off"
            toggleAxis={false}
            zoomOut={false}
            hoverState=""
            enableTransition={false}
          />
        </ShaderGradientCanvas>
      </div>
      
      {/* Centered Glass Card UI */}
      <div className="absolute inset-0 z-10 flex items-center justify-center p-4">
        <LiquidGlassCard
          draggable={true}
          expandable={false}
          width="100%"
          height="auto"
          className="max-w-3xl overflow-hidden"
          blurIntensity="lg"
          borderRadius="32px"
          glowIntensity="lg"
          shadowIntensity="lg"
        >
          <InternAgentForm />
        </LiquidGlassCard>
      </div>
    </div>
  );
}

export default App;
