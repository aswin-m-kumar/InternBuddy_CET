import { ShaderGradientCanvas, ShaderGradient } from "@shadergradient/react";
import { Navigate, Route, Routes } from "react-router-dom";
import { LiquidGlassCard } from "./components/LiquidGlassCard";
import { Auth } from "./pages/Auth";
import { Dashboard } from "./pages/Dashboard";
import { Landing } from "./pages/Landing";

function App() {
  return (
    <div className="relative min-h-[100svh] w-full overflow-x-hidden bg-[#d9dde3]">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <ShaderGradientCanvas
          style={{ width: "100%", height: "100%" }}
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
            color1="#f6f7f9"
            color2="#d7dbe2"
            color3="#9ca4b1"
            reflection={0.1}
            cAzimuthAngle={170}
            cPolarAngle={70}
            cDistance={4.4}
            cameraZoom={1}
            lightType="3d"
            brightness={1.2}
            envPreset="dawn"
            grain="off"
            toggleAxis={false}
            zoomOut={false}
            hoverState=""
            enableTransition={false}
          />
        </ShaderGradientCanvas>
      </div>

      {/* Overlay gradients */}
      <div className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(circle_at_center,rgba(250,250,252,0.3)_0%,rgba(214,220,230,0.5)_65%,rgba(160,168,182,0.66)_100%)]" />
      <div className="pointer-events-none absolute inset-0 z-[2] bg-[linear-gradient(155deg,rgba(255,255,255,0.35)_0%,rgba(255,255,255,0.08)_44%,rgba(72,78,88,0.22)_100%)]" />
      <div className="pointer-events-none absolute -left-20 top-12 z-[3] h-56 w-56 rounded-full bg-white/35 blur-3xl" />
      <div className="pointer-events-none absolute -right-12 bottom-8 z-[3] h-64 w-64 rounded-full bg-[#8d96a6]/30 blur-3xl" />

      {/* Main Content */}
      <div className="relative z-10 min-h-[100svh]">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route
            path="/auth"
            element={
              <div className="flex min-h-[100svh] items-center justify-center p-3 sm:p-8">
                <Auth />
              </div>
            }
          />
          <Route
            path="/dashboard"
            element={
              <div className="flex min-h-[100svh] items-start justify-center p-3 sm:items-center sm:p-8">
                <LiquidGlassCard
                  draggable={false}
                  expandable={false}
                  width="100%"
                  height="auto"
                  className="max-w-6xl overflow-hidden"
                  blurIntensity="xl"
                  borderRadius="32px"
                  glowIntensity="xl"
                  shadowIntensity="xl"
                >
                  <Dashboard />
                </LiquidGlassCard>
              </div>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
