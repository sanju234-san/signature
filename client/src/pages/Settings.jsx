import { useState, useEffect } from 'react';
import { Save, Download, Upload, Trash2, Server, RefreshCw, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useToast } from '../components/Toast';
import { getUserPrefs, saveUserPrefs, exportAllData, importData } from '../utils/storage';
import { checkHealth, getModelInfo, reloadModel } from '../utils/api';

export default function Settings() {
    const [prefs, setPrefs] = useState({
        theme: 'light',
        defaultView: 'grid',
        itemsPerPage: 10,
        autoSave: true,
        notifications: true
    });
    const [serverStatus, setServerStatus] = useState({ checking: true });
    const [modelInfo, setModelInfo] = useState(null);
    const { showSaving, showSaved, showError } = useToast();

    useEffect(() => {
        loadPrefs();
        checkServerStatus();
    }, []);

    const loadPrefs = async () => {
        try {
            const p = await getUserPrefs();
            setPrefs(p);
        } catch (error) {
            console.error('Error loading preferences:', error);
        }
    };

    const checkServerStatus = async () => {
        setServerStatus({ checking: true });
        try {
            const health = await checkHealth();
            const info = await getModelInfo();
            setServerStatus({
                checking: false,
                isHealthy: health.isHealthy,
                modelLoaded: health.modelLoaded,
                timestamp: health.timestamp
            });
            setModelInfo(info);
        } catch (error) {
            setServerStatus({
                checking: false,
                isHealthy: false,
                error: error.message
            });
        }
    };

    const handleReloadModel = async () => {
        const loadingId = showSaving();
        try {
            const result = await reloadModel();
            if (result.status === 'success') {
                showSaved(loadingId);
                await checkServerStatus();
            } else {
                showError('Failed to reload model');
            }
        } catch (error) {
            showError('Error reloading model');
        }
    };

    const handleSave = async () => {
        const loadingId = showSaving();
        try {
            await saveUserPrefs(prefs);
            showSaved(loadingId);
        } catch (error) {
            showError('Error saving preferences');
        }
    };

    const handleExport = async () => {
        try {
            const data = await exportAllData();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `sigverify-backup-${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            showError('Error exporting data');
        }
    };

    const handleImport = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const loadingId = showSaving();
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            await importData(data);
            showSaved(loadingId);
            window.location.reload();
        } catch (error) {
            showError('Error importing data');
        }
    };

    const handleClearData = async () => {
        if (!confirm('Are you sure you want to clear all data? This cannot be undone.')) return;

        try {
            localStorage.clear();
            showSaved();
            window.location.reload();
        } catch (error) {
            showError('Error clearing data');
        }
    };

    return (
        <div>
            <h1 style={{ marginBottom: '1.5rem' }}>Settings</h1>

            {/* API Server Status */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Server size={18} />
                        API Server Status
                    </h3>
                    <button
                        className="btn btn-outline"
                        onClick={checkServerStatus}
                        style={{ padding: '0.5rem 0.75rem' }}
                    >
                        <RefreshCw size={14} className={serverStatus.checking ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                </div>

                <div style={{ display: 'grid', gap: '0.75rem' }}>
                    {/* Server Health */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.75rem 1rem',
                        background: serverStatus.isHealthy ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        borderRadius: '0.5rem',
                        border: `1px solid ${serverStatus.isHealthy ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                    }}>
                        {serverStatus.checking ? (
                            <AlertCircle size={18} style={{ color: 'var(--warning)' }} />
                        ) : serverStatus.isHealthy ? (
                            <CheckCircle size={18} style={{ color: 'var(--success)' }} />
                        ) : (
                            <XCircle size={18} style={{ color: 'var(--error)' }} />
                        )}
                        <div>
                            <div style={{ fontWeight: 500 }}>
                                {serverStatus.checking ? 'Checking...' : serverStatus.isHealthy ? 'Server Online' : 'Server Offline'}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                {serverStatus.isHealthy ? 'http://localhost:8000' : 'Start server with: python app.py'}
                            </div>
                        </div>
                    </div>

                    {/* Model Status */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.75rem 1rem',
                        background: serverStatus.modelLoaded ? 'rgba(34, 197, 94, 0.1)' : 'rgba(251, 191, 36, 0.1)',
                        borderRadius: '0.5rem',
                        border: `1px solid ${serverStatus.modelLoaded ? 'rgba(34, 197, 94, 0.3)' : 'rgba(251, 191, 36, 0.3)'}`
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            {serverStatus.modelLoaded ? (
                                <CheckCircle size={18} style={{ color: 'var(--success)' }} />
                            ) : (
                                <AlertCircle size={18} style={{ color: 'var(--warning)' }} />
                            )}
                            <div>
                                <div style={{ fontWeight: 500 }}>
                                    {serverStatus.modelLoaded ? 'Model Loaded' : 'No Model Loaded'}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                    {modelInfo?.architecture?.total_parameters
                                        ? `${(modelInfo.architecture.total_parameters / 1000).toFixed(1)}K parameters`
                                        : 'Train a model with: python train.py'}
                                </div>
                            </div>
                        </div>
                        {serverStatus.isHealthy && (
                            <button className="btn btn-outline" onClick={handleReloadModel} style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}>
                                Reload Model
                            </button>
                        )}
                    </div>
                </div>

                <p style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    When the server is offline, the app uses mock predictions. Start the Python server for real AI analysis.
                </p>
            </div>

            {/* Preferences */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ marginBottom: '1rem' }}>Preferences</h3>

                <div style={{ display: 'grid', gap: '1rem', maxWidth: '400px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                            Default View
                        </label>
                        <select
                            className="input select"
                            value={prefs.defaultView}
                            onChange={(e) => setPrefs(p => ({ ...p, defaultView: e.target.value }))}
                        >
                            <option value="grid">Grid View</option>
                            <option value="list">List View</option>
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                            Items Per Page
                        </label>
                        <select
                            className="input select"
                            value={prefs.itemsPerPage}
                            onChange={(e) => setPrefs(p => ({ ...p, itemsPerPage: parseInt(e.target.value) }))}
                        >
                            <option value="10">10</option>
                            <option value="25">25</option>
                            <option value="50">50</option>
                            <option value="100">100</option>
                        </select>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <input
                            type="checkbox"
                            id="autoSave"
                            checked={prefs.autoSave}
                            onChange={(e) => setPrefs(p => ({ ...p, autoSave: e.target.checked }))}
                            style={{ width: '18px', height: '18px' }}
                        />
                        <label htmlFor="autoSave" style={{ fontSize: '0.875rem' }}>
                            Enable auto-save
                        </label>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <input
                            type="checkbox"
                            id="notifications"
                            checked={prefs.notifications}
                            onChange={(e) => setPrefs(p => ({ ...p, notifications: e.target.checked }))}
                            style={{ width: '18px', height: '18px' }}
                        />
                        <label htmlFor="notifications" style={{ fontSize: '0.875rem' }}>
                            Show notifications
                        </label>
                    </div>

                    <button className="btn btn-primary" onClick={handleSave} style={{ marginTop: '0.5rem' }}>
                        <Save size={16} />
                        Save Preferences
                    </button>
                </div>
            </div>

            {/* Data Management */}
            <div className="card">
                <h3 style={{ marginBottom: '1rem' }}>Data Management</h3>

                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <button className="btn btn-outline" onClick={handleExport}>
                        <Download size={16} />
                        Export All Data
                    </button>

                    <label className="btn btn-outline" style={{ cursor: 'pointer' }}>
                        <Upload size={16} />
                        Import Data
                        <input
                            type="file"
                            accept=".json"
                            onChange={handleImport}
                            style={{ display: 'none' }}
                        />
                    </label>

                    <button className="btn btn-danger" onClick={handleClearData}>
                        <Trash2 size={16} />
                        Clear All Data
                    </button>
                </div>

                <p style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Data is stored locally in your browser using localStorage. Export regularly to backup your data.
                </p>
            </div>
        </div>
    );
}
