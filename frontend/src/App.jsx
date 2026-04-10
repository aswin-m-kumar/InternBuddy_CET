import { ShaderGradientCanvas, ShaderGradient } from '@shadergradient/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { LiquidGlassCard } from './components/LiquidGlassCard';
import { Dashboard } from './pages/Dashboard';

function App() {
  return (
    <div className="relative min-h-[100svh] w-screen overflow-hidden bg-[#081517]">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <ShaderGradientCanvas
          style={{ width: '100%', height: '100%' }}
          lazyLoad
          pixelDensity={1}
          pointerEvents="none"
        >
          <ShaderGradient
            animate="on"
            type="waterPlane"
            wireframe={false}
            shader="defaults"
            uTime={0}
            uSpeed={0.15}
            uStrength={2.8}
            uDensity={1.1}
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

      {/* Overlay gradients */}
      <div className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(circle_at_center,rgba(7,16,20,0.14)_0%,rgba(7,16,20,0.46)_70%,rgba(7,16,20,0.62)_100%)]" />
      <div className="pointer-events-none absolute inset-0 z-[2] bg-[linear-gradient(155deg,rgba(255,255,255,0.1)_0%,rgba(255,255,255,0)_42%,rgba(0,0,0,0.28)_100%)]" />
      <div className="pointer-events-none absolute -left-20 top-12 z-[3] h-56 w-56 rounded-full bg-[#9af9f3]/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-12 bottom-8 z-[3] h-64 w-64 rounded-full bg-[#80d6ff]/20 blur-3xl" />

      {/* Main Content */}
      <div className="absolute inset-0 z-10 flex items-center justify-center p-4 sm:p-8">
        <LiquidGlassCard
          draggable={false}
          expandable={false}
          width="100%"
          height="auto"
          className="max-w-5xl overflow-hidden"
          blurIntensity="xl"
          borderRadius="32px"
          glowIntensity="xl"
          shadowIntensity="xl"
        >
          <Dashboard />
        </LiquidGlassCard>
      </div>
      <SpeedInsights />
    </div>
  );
}

export default App;
