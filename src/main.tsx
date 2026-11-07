import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { startAutoRefresh } from './utils/autoRefresh';
import { applyDisplay, loadDisplay } from './utils/display';

// Terapkan ukuran huruf dan mode warna yang dipilih sebelum tampilan dibuat
applyDisplay(loadDisplay());
startAutoRefresh();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
