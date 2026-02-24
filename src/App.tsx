/**
 * App.tsx - Router principal: / (tela inicial) e /admin (login + dashboard)
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MainApp } from './MainApp';
import { AdminGate } from './components/views/AdminGate';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainApp />} />
        <Route path="/admin" element={<AdminGate />} />
      </Routes>
    </BrowserRouter>
  );
}
