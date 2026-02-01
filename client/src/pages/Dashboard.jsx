import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Search, ChevronLeft, ChevronRight, Trash2, Eye } from 'lucide-react';
import {
    BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import EditableField from '../components/EditableField';
import { useToast } from '../components/Toast';
import {
    getAllSignatures, saveSignature, deleteSignature, generateSignatureId, recalculateMetrics, getMetrics
} from '../utils/storage';

// Sample signature names for demo
const sampleNames = [
    'John A. Smith', 'Sarah J. Davis', 'Michael B. Lee', 'Piran Collentine',
    'John D. Leg', 'John A. Smith', 'John A. Smith', 'Sarah J. Davis',
    'John Strong', 'John D. Jong', 'John A. Lee', 'John A. Smith'
];

export default function Dashboard() {
    const [signatures, setSignatures] = useState([]);
    const [metrics, setMetrics] = useState({
        confidenceDistribution: { high: 90.5, medium: 70.89, low: 17.3 },
        accuracyTrends: []
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [dateFilter, setDateFilter] = useState('30');
    const [isDragging, setIsDragging] = useState(false);
    const { showSaving, showSaved, showError } = useToast();
    const navigate = useNavigate();

    // Load data on mount
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const sigs = await getAllSignatures();
            if (sigs.length === 0) {
                // Generate sample data on first load
                const sampleData = generateSampleData();
                for (const sig of sampleData) {
                    await saveSignature(sig);
                }
                setSignatures(sampleData);
            } else {
                setSignatures(sigs);
            }
            const m = await recalculateMetrics();
            setMetrics(m);
        } catch (error) {
            console.error('Error loading data:', error);
        }
    };

    const generateSampleData = () => {
        const classifications = ['Authentic', 'Forged', 'Stylized'];
        return Array.from({ length: 12 }, (_, i) => ({
            id: `SIG-20231027-${String(i + 1).padStart(3, '0')}`,
            name: sampleNames[i % sampleNames.length],
            timestamp: new Date(2023, 9, 27, 10 + Math.floor(i / 2), 15 + (i * 5)).toISOString(),
            classification: classifications[i % 3],
            confidence: (75 + Math.random() * 24).toFixed(1),
            imageData: null
        }));
    };

    const handleDrop = useCallback(async (e) => {
        e.preventDefault();
        setIsDragging(false);

        const files = Array.from(e.dataTransfer?.files || e.target?.files || []);
        const imageFiles = files.filter(f => f.type.startsWith('image/'));

        if (imageFiles.length === 0) {
            showError('Please upload image files (PNG, JPG, JPEG)');
            return;
        }

        const loadingId = showSaving();

        try {
            for (const file of imageFiles) {
                // Call backend API for real prediction
                let prediction = { prediction: 'GENUINE', confidence: 85, isMock: true };
                try {
                    const { predictSignature, generateMockAnalysis } = await import('../utils/api');
                    prediction = await predictSignature(file);
                } catch (apiError) {
                    console.warn('API unavailable, using mock data:', apiError);
                }

                // Read file for display
                const reader = new FileReader();
                reader.onload = async (event) => {
                    const mockAnalysis = prediction.isMock ? {
                        strokePressure: { start: 80 + Math.random() * 15, mid: 85 + Math.random() * 12, end: 80 + Math.random() * 15 },
                        fluidity: 90 + Math.random() * 8,
                        slantAngle: Math.floor(Math.random() * 30) - 5
                    } : {
                        strokePressure: { start: 82, mid: 92, end: 86 },
                        fluidity: prediction.confidence * 0.98,
                        slantAngle: 12
                    };

                    const newSig = {
                        id: generateSignatureId(),
                        name: file.name.replace(/\.[^.]+$/, ''),
                        timestamp: new Date().toISOString(),
                        classification: prediction.prediction === 'GENUINE' ? 'Authentic' : 'Forged',
                        confidence: parseFloat(prediction.confidence).toFixed(1),
                        imageData: event.target.result,
                        fileName: file.name,
                        fromAPI: !prediction.isMock,
                        ...mockAnalysis
                    };

                    await saveSignature(newSig);
                    setSignatures(prev => [newSig, ...prev]);

                    // Navigate to Analysis page after first upload
                    if (imageFiles.length === 1 || imageFiles.indexOf(file) === 0) {
                        setTimeout(() => {
                            navigate(`/analysis?id=${newSig.id}`);
                        }, 600);
                    }
                };
                reader.readAsDataURL(file);
            }

            setTimeout(async () => {
                const m = await recalculateMetrics();
                setMetrics(m);
                showSaved(loadingId);
            }, 500);
        } catch (error) {
            showError('Error uploading signatures');
        }
    }, [showSaving, showSaved, showError, navigate]);

    const handleUpdateSignature = async (id, field, value) => {
        const loadingId = showSaving();
        try {
            const sig = signatures.find(s => s.id === id);
            if (sig) {
                const updated = { ...sig, [field]: value };
                await saveSignature(updated);
                setSignatures(prev => prev.map(s => s.id === id ? updated : s));

                if (field === 'confidence' || field === 'classification') {
                    const m = await recalculateMetrics();
                    setMetrics(m);
                }
            }
            showSaved(loadingId);
        } catch (error) {
            showError('Error updating signature');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this signature?')) return;

        const loadingId = showSaving();
        try {
            await deleteSignature(id);
            setSignatures(prev => prev.filter(s => s.id !== id));
            const m = await recalculateMetrics();
            setMetrics(m);
            showSaved(loadingId);
        } catch (error) {
            showError('Error deleting signature');
        }
    };

    // Filter and paginate
    const filteredSignatures = signatures.filter(sig =>
        sig.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sig.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredSignatures.length / itemsPerPage);
    const paginatedSignatures = filteredSignatures.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Chart data
    const confidenceData = [
        { name: 'High (90%+)', value: parseFloat(metrics.confidenceDistribution?.high) || 0 },
        { name: 'Medium (70-89%)', value: parseFloat(metrics.confidenceDistribution?.medium) || 0 },
        { name: 'Low (<70%)', value: parseFloat(metrics.confidenceDistribution?.low) || 0 },
    ];

    const trendData = metrics.accuracyTrends?.length > 0 ? metrics.accuracyTrends : [
        { day: 'Low', authentic: 20, forged: 15 },
        { day: 'Sun', authentic: 35, forged: 20 },
        { day: 'Time', authentic: 45, forged: 25 },
        { day: 'Tues', authentic: 55, forged: 30 },
        { day: 'Treat', authentic: 65, forged: 35 },
        { day: 'Thus', authentic: 85, forged: 45 },
    ];

    const formatDate = (isoString) => {
        const date = new Date(isoString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getClassBadge = (classification) => {
        const styles = {
            Authentic: 'badge-success',
            Forged: 'badge-error',
            Stylized: 'badge-warning'
        };
        return styles[classification] || 'badge-primary';
    };

    return (
        <div style={{ padding: '0' }}>
            <h1 style={{ marginBottom: '1.5rem' }}>Signature Classification Dashboard</h1>

            {/* Upload Zone */}
            <div
                className={`upload-zone ${isDragging ? 'dragover' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => document.getElementById('fileInput').click()}
                style={{ marginBottom: '1.5rem' }}
            >
                <input
                    id="fileInput"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleDrop}
                    style={{ display: 'none' }}
                />
                <Upload className="upload-zone-icon" size={40} />
                <p className="upload-zone-text">
                    Drag & drop signature images here or{' '}
                    <span className="upload-zone-link">browse files</span>
                </p>
            </div>

            {/* Performance Metrics */}
            <h3 style={{ marginBottom: '1rem' }}>Performance Metrics</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                {/* Confidence Score Distribution */}
                <div className="card">
                    <h4 style={{ marginBottom: '1rem', fontSize: '0.875rem', fontWeight: 600 }}>
                        Confidence Score Distribution
                    </h4>
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={confidenceData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                                <Tooltip />
                                <Bar dataKey="value" fill="#1e3a5f" radius={[4, 4, 0, 0]} label={{ position: 'top', fontSize: 11 }} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Classification Accuracy Trends */}
                <div className="card">
                    <div className="card-header">
                        <h4 style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                            Classification Accuracy Trends
                        </h4>
                        <select
                            className="input select"
                            style={{ width: 'auto', padding: '0.375rem 2rem 0.375rem 0.75rem', fontSize: '0.75rem' }}
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                        >
                            <option value="7">Last 7 Days</option>
                            <option value="30">Last 30 Days</option>
                            <option value="90">Last 90 Days</option>
                        </select>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem', fontSize: '0.75rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <span style={{ width: 12, height: 12, background: '#1e3a5f', borderRadius: 2 }}></span>
                            Authentic
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <span style={{ width: 12, height: 12, background: '#60a5fa', borderRadius: 2 }}></span>
                            Forged
                        </span>
                    </div>
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={trendData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                                <Tooltip />
                                <Line type="monotone" dataKey="authentic" stroke="#1e3a5f" strokeWidth={2} dot={{ r: 4 }} />
                                <Line type="monotone" dataKey="forged" stroke="#60a5fa" strokeWidth={2} dot={{ r: 4 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Recent Classifications */}
            <div className="card">
                <div className="card-header">
                    <h4 style={{ fontSize: '0.875rem', fontWeight: 600 }}>Recent Classifications</h4>
                    <div style={{ position: 'relative', width: '250px' }}>
                        <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            className="input"
                            placeholder="Search by ID or name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ paddingLeft: '2.25rem' }}
                        />
                    </div>
                </div>

                <table className="table">
                    <thead>
                        <tr>
                            <th>Signature ID</th>
                            <th>Timestamp</th>
                            <th>Predicted Class</th>
                            <th>Confidence %</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedSignatures.map((sig) => (
                            <tr key={sig.id}>
                                <td>
                                    <span className="mono" style={{ fontSize: '0.8125rem', color: 'var(--primary)' }}>
                                        {sig.id}
                                    </span>
                                </td>
                                <td>
                                    <EditableField
                                        value={formatDate(sig.timestamp)}
                                        onSave={(val) => handleUpdateSignature(sig.id, 'timestamp', new Date(val).toISOString())}
                                    />
                                </td>
                                <td>
                                    <select
                                        className={`badge ${getClassBadge(sig.classification)}`}
                                        value={sig.classification}
                                        onChange={(e) => handleUpdateSignature(sig.id, 'classification', e.target.value)}
                                        style={{ border: 'none', cursor: 'pointer', appearance: 'none', paddingRight: '0.75rem' }}
                                    >
                                        <option value="Authentic">Authentic</option>
                                        <option value="Forged">Forged</option>
                                        <option value="Stylized">Stylized</option>
                                    </select>
                                </td>
                                <td>
                                    <EditableField
                                        value={`${sig.confidence}%`}
                                        onSave={(val) => handleUpdateSignature(sig.id, 'confidence', parseFloat(val.replace('%', '')))}
                                        validate={(val) => {
                                            const num = parseFloat(val.replace('%', ''));
                                            return !isNaN(num) && num >= 0 && num <= 100;
                                        }}
                                    />
                                </td>
                                <td>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            className="btn btn-primary"
                                            style={{ padding: '0.375rem 0.625rem' }}
                                            onClick={() => navigate(`/analysis?id=${sig.id}`)}
                                            title="View Analysis"
                                        >
                                            <Eye size={14} />
                                        </button>
                                        <button
                                            className="btn btn-outline"
                                            style={{ padding: '0.375rem 0.625rem' }}
                                            onClick={() => handleDelete(sig.id)}
                                            title="Delete"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Pagination */}
                <div className="pagination">
                    <button
                        className="pagination-btn"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                    >
                        <ChevronLeft size={16} />
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map((page) => (
                        <button
                            key={page}
                            className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
                            onClick={() => setCurrentPage(page)}
                        >
                            {page}
                        </button>
                    ))}
                    <button
                        className="pagination-btn"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}
