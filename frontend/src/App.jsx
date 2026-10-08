import React, { useMemo } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { isLoggedIn } from './api';
import HomePage from './pages/HomePage';
import LobbyPage from './pages/LobbyPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import RoomPage from './pages/RoomPage';
import './App.css';

const PARTICLE_TYPES = ['brush', 'eraser', 'palette', 'pencil', 'bucket', 'marker'];
const PARTICLES_PER_TYPE = 10;
const ANIMATIONS = ['float1', 'float2', 'float3', 'flyNE', 'flyNW', 'flyUp', 'flyDown'];

const randomPercent = () => `${Math.random() * 100}%`;

// Decorative drawing tools that drift across the background, each starting from a random screen edge.
function createParticles() {
  return PARTICLE_TYPES.flatMap((type) =>
    Array.from({ length: PARTICLES_PER_TYPE }, () => {
      const edge = Math.floor(Math.random() * 4);
      const position = randomPercent();
      const start = [
        { left: '-10%', top: position },
        { left: '110%', top: position },
        { top: '-10%', left: position },
        { top: '110%', left: position },
      ][edge];
      return {
        type,
        style: {
          ...start,
          animationName: ANIMATIONS[Math.floor(Math.random() * ANIMATIONS.length)],
          animationDelay: `${Math.random() * 10}s`,
          animationDuration: `${10 + Math.random() * 15}s`,
          animationFillMode: 'both',
        },
      };
    })
  );
}

function RequireAuth({ children }) {
  return isLoggedIn() ? children : <Navigate to="/login" replace />;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/lobby" element={<RequireAuth><LobbyPage /></RequireAuth>} />
      <Route path="/rooms/:code" element={<RequireAuth><RoomPage /></RequireAuth>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  const particles = useMemo(createParticles, []);

  return (
    <>
      <div className="particles" aria-hidden="true">
        {particles.map(({ type, style }, idx) => (
          <div key={`${type}-${idx}`} className={`particle ${type}`} style={style} />
        ))}
      </div>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </>
  );
}
