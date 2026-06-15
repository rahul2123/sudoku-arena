import { useState, useCallback } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import type { Difficulty, Settings } from '@/types';
import { Header } from '@/components/Header';
import { HomePage } from '@/pages/HomePage';
import { GamePage } from '@/pages/GamePage';
import { HistoryPage } from '@/pages/HistoryPage';
import { TipsPage } from '@/pages/TipsPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { loadSettings, saveSettings } from '@/lib/storage';

export default function App() {
  const [settings, setSettings] = useState<Settings>(() => loadSettings());
  const navigate = useNavigate();

  const updateSettings = useCallback((next: Settings) => {
    setSettings(next);
    saveSettings(next);
  }, []);

  const startGame = useCallback((d: Difficulty) => {
    navigate(`/play/${d}`);
  }, [navigate]);

  return (
    <div className="app-shell">
      <Header />
      <Routes>
        <Route path="/" element={<HomePage onStart={startGame} />} />
        <Route path="/play/:difficulty" element={<GamePage settings={settings} />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/tips" element={<TipsPage />} />
        <Route path="/settings" element={<SettingsPage settings={settings} onChange={updateSettings} />} />
        <Route path="*" element={<HomePage onStart={startGame} />} />
      </Routes>
    </div>
  );
}
