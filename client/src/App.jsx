import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { ToastProvider } from './components/Toast';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import BatchProcessing from './pages/BatchProcessing';
import Analysis from './pages/Analysis';
import Settings from './pages/Settings';
import './App.css';

function AppLayout() {
  const location = useLocation();

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/batches" element={<BatchProcessing />} />
          <Route path="/training" element={<ModelTraining />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </div>
  );
}

function ModelTraining() {
  return (
    <div>
      <h1 style={{ marginBottom: '1.5rem' }}>Model Training</h1>
      <div className="card">
        <p style={{ color: 'var(--text-secondary)' }}>
          Model training interface coming soon. Configure and train custom signature verification models.
        </p>
      </div>
    </div>
  );
}

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/analysis" element={<Analysis />} />
          <Route path="/*" element={<AppLayout />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
