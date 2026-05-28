import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App.tsx';

// main.tsx es el punto de entrada. Aquí pasan tres cosas:
// 1. StrictMode → React activa chequeos extra en desarrollo.
// 2. BrowserRouter → habilita el routing basado en URL del navegador.
// 3. createRoot → la API moderna de React 18+ para montar la app.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
