import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useMemo } from 'react';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import LobbyPage from './pages/LobbyPage';
import RoomPage from './pages/RoomPage';
import './App.css';

export function isLoggedIn() {
    const token = localStorage.getItem('access_token');
    return Boolean(token);
}

export default function App() {
    // Helper to generate random percentage positions
    const randPercent = () => `${Math.random() * 100}%`;

    const animNames = ['float1', 'float2', 'float3', 'flyNE', 'flyNW', 'flyUp', 'flyDown'];

    const particlesList = useMemo(() => {
      return ['brush', 'eraser', 'palette', 'pencil', 'bucket', 'marker'].flatMap(type =>
        Array.from({ length: 10 }).map((_, i) => {
          // pick random animation
          const animName = animNames[Math.floor(Math.random() * animNames.length)];
          // random duration between 10s and 25s
          const duration = 10 + Math.random() * 15;
          // random start edge: 0=left,1=right,2=top,3=bottom
          const edge = Math.floor(Math.random() * 4);
          let style = {};
          const pos = randPercent();
          // set starting position on chosen edge
          if (edge === 0) style = { left: '-10%', top: pos };
          else if (edge === 1) style = { left: '110%', top: pos };
          else if (edge === 2) style = { top: '-10%', left: pos };
          else style = { top: '110%', left: pos };
          return {
            type,
            animName,
            delay: Math.random() * 10,
            duration,
            style,
          };
        })
      );
    }, []);

    return (
      <>
        <div className="particles">
          {particlesList.map(({ type, animName, delay, duration, style }, idx) => (
            <div
              key={`${type}-${idx}`}
              className={`particle ${type}`}
              style={{
                animationName: animName,
                animationDelay: `${delay}s`,
                animationDuration: `${duration}s`,
                animationFillMode: 'both',
                ...style
              }}
            />
          ))}
        </div>
        <BrowserRouter>
        <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route 
            path="/lobby" 
            element={ isLoggedIn() ? <LobbyPage /> : <Navigate to="/login" replace />} />
            <Route 
            path="/rooms/:code"
            element={ isLoggedIn() ? <RoomPage /> : <Navigate to="/login" replace />}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </BrowserRouter>
      </>
    );
}