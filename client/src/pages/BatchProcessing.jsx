import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Download, MoreVertical, User, Eye } from 'lucide-react';
import EditableField from '../components/EditableField';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';
import {
    getAllSignatures, saveSignature, getAllBatches, saveBatch, generateBatchId, exportAllData
} from '../utils/storage';

// Sample signature names
const signatureNames = [
    'John A. Smith', 'Sarah J. Davis', 'Michael B. Lee', 'Piran Collentine',
    'John D. Leg', 'John A. Smith', 'John D. Jong', 'John A. Lee',
    'Sarah J. Davis', 'John Strong', 'John E. Longo', 'John A. Smith'
];

export default function BatchProcessing() {
    const [signatures, setSignatures] = useState([]);
    const [batches, setBatches] = useState([]);
    const [selectedBatch, setSelectedBatch] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('confidence');
    const [dateRange, setDateRange] = useState('24');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newBatchName, setNewBatchName] = useState('');
    const { showSaving, showSaved, showError } = useToast();
    const navigate = useNavigate();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            let sigs = await getAllSignatures();

            // Generate sample signatures if empty
            if (sigs.length === 0) {
                sigs = generateSampleSignatures();
                for (const sig of sigs) {
                    await saveSignature(sig);
                }
            }
            setSignatures(sigs);

            let b = await getAllBatches();
            if (b.length === 0) {
                // Create default batch
                const defaultBatch = {
                    id: '#24588',
                    name: 'Default Batch',
                    totalSignatures: sigs.length,
                    verified: sigs.filter(s => s.classification === 'Authentic').length,
                    processing: sigs.filter(s => s.classification === 'Stylized').length,
                    forgeries: sigs.filter(s => s.classification === 'Forged').length,
                    createdDate: new Date().toISOString(),
                    lastModified: new Date().toISOString()
                };
                await saveBatch(defaultBatch);
                b = [defaultBatch];
            }
            setBatches(b);
            setSelectedBatch(b[0]);
        } catch (error) {
            console.error('Error loading data:', error);
        }
    };

    const generateSampleSignatures = () => {
        const statuses = ['Verified', 'Processing', 'Flagged'];
        return signatureNames.map((name, i) => ({
            id: `SIG-20231027-${String(i + 1).padStart(3, '0')}`,
            name,
            timestamp: new Date().toISOString(),
            classification: i % 5 === 1 ? 'Forged' : i % 7 === 3 ? 'Stylized' : 'Authentic',
            confidence: (70 + Math.random() * 29).toFixed(1),
            status: statuses[i % 3],
            imageData: null
        }));
    };

    const handleUpdateSignature = async (id, field, value) => {
        const loadingId = showSaving();
        try {
            const sig = signatures.find(s => s.id === id);
            if (sig) {
                const updated = { ...sig, [field]: value };
                await saveSignature(updated);
                setSignatures(prev => prev.map(s => s.id === id ? updated : s));

                // Update batch summary
                if (selectedBatch) {
                    const allSigs = signatures.map(s => s.id === id ? updated : s);
                    const updatedBatch = {
                        ...selectedBatch,
                        verified: allSigs.filter(s => s.status === 'Verified').length,
                        processing: allSigs.filter(s => s.status === 'Processing').length,
                        forgeries: allSigs.filter(s => s.status === 'Flagged').length,
                    };
                    await saveBatch(updatedBatch);
                    setSelectedBatch(updatedBatch);
                }
            }
            showSaved(loadingId);
        } catch (error) {
            showError('Error updating signature');
        }
    };

    const handleCreateBatch = async () => {
        if (!newBatchName.trim()) {
            showError('Please enter a batch name');
            return;
        }

        const loadingId = showSaving();
        try {
            const newBatch = {
                id: generateBatchId(),
                name: newBatchName,
                totalSignatures: 0,
                verified: 0,
                processing: 0,
                forgeries: 0,
                createdDate: new Date().toISOString(),
                lastModified: new Date().toISOString()
            };
            await saveBatch(newBatch);
            setBatches(prev => [newBatch, ...prev]);
            setSelectedBatch(newBatch);
            setNewBatchName('');
            setIsModalOpen(false);
            showSaved(loadingId);
        } catch (error) {
            showError('Error creating batch');
        }
    };

    const handleExport = async () => {
        try {
            const data = await exportAllData();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `sigverify-export-${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            showError('Error exporting data');
        }
    };

    // Filter and sort signatures
    const filteredSignatures = signatures
        .filter(sig =>
            sig.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            sig.name?.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => {
            if (sortBy === 'confidence') return parseFloat(b.confidence) - parseFloat(a.confidence);
            if (sortBy === 'name') return a.name.localeCompare(b.name);
            if (sortBy === 'date') return new Date(b.timestamp) - new Date(a.timestamp);
            return 0;
        });

    const getStatusBadge = (status) => {
        const styles = {
            Verified: 'badge-success',
            Processing: 'badge-warning',
            Flagged: 'badge-error'
        };
        return styles[status] || 'badge-primary';
    };

    return (
        <div style={{ display: 'flex', height: '100%', background: 'white', borderRadius: '0.75rem', overflow: 'hidden' }}>
            {/* Main Content */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {/* Dark Header */}
                <div className="dark-header">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <h1>Batch Processing Management</h1>
                            <p>AI-Powered Signature Classification & Verification</p>
                        </div>
                        <div className="navbar-avatar" style={{ background: 'rgba(255,255,255,0.2)' }}>
                            <User size={18} />
                        </div>
                    </div>
                </div>

                {/* Controls Bar */}
                <div className="controls-bar">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Sort By:</span>
                        <select
                            className="input select"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                        >
                            <option value="confidence">Confidence Level (High to Low)</option>
                            <option value="name">Name</option>
                            <option value="date">Date</option>
                        </select>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Date Range:</span>
                        <select
                            className="input select"
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                        >
                            <option value="24">Last 24 Hours</option>
                            <option value="7">Last 7 Days</option>
                            <option value="30">Last 30 Days</option>
                        </select>
                    </div>

                    <div className="controls-bar-search" style={{ position: 'relative' }}>
                        <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            className="input"
                            placeholder="Search Batch ID or Name"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ paddingLeft: '2.25rem', width: '100%' }}
                        />
                    </div>

                    <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
                        Process Selected Batches
                    </button>
                </div>

                {/* Signature Grid */}
                <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto' }}>
                    <div style={{ marginBottom: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        All
                    </div>
                    <div className="grid-6">
                        {filteredSignatures.map((sig) => (
                            <div
                                key={sig.id}
                                className="sig-card"
                                onClick={() => navigate(`/analysis?id=${sig.id}`)}
                                style={{ cursor: 'pointer' }}
                            >
                                <div className="sig-card-image">
                                    {sig.imageData ? (
                                        <img src={sig.imageData} alt={sig.name} style={{ maxWidth: '100%', maxHeight: '80px' }} />
                                    ) : (
                                        <span style={{ fontFamily: "'Brush Script MT', cursive", fontSize: '1.25rem' }}>
                                            {sig.name}
                                        </span>
                                    )}
                                </div>
                                <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
                                    <div className="sig-card-name" onClick={(e) => e.stopPropagation()}>
                                        <EditableField
                                            value={sig.name}
                                            onSave={(val) => handleUpdateSignature(sig.id, 'name', val)}
                                        />
                                    </div>
                                    {sig.classification === 'Forged' && (
                                        <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>(Possible Forgery)</div>
                                    )}
                                </div>
                                <div className="sig-card-footer">
                                    <span className={`badge ${getStatusBadge(sig.status)}`} style={{ fontSize: '0.625rem' }}>
                                        {sig.status}
                                    </span>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                        Confidence: <strong>{sig.confidence}%</strong>
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Batch Summary Sidebar */}
            <div className="batch-sidebar">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div className="batch-sidebar-title">
                        Batch Summary Report (ID: {selectedBatch?.id || '#24588'})
                    </div>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                        <MoreVertical size={16} style={{ color: 'var(--text-muted)' }} />
                    </button>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <div className="batch-stat">
                        <span className="batch-stat-label">Total Signatures:</span>
                        <span className="batch-stat-value">{selectedBatch?.totalSignatures || signatures.length}</span>
                    </div>
                    <div className="batch-stat">
                        <span className="batch-stat-label">
                            <span className="batch-stat-dot" style={{ background: 'var(--success)' }}></span>
                            Verified:
                        </span>
                        <span className="batch-stat-value" style={{ color: 'var(--success)' }}>
                            {selectedBatch?.verified || signatures.filter(s => s.status === 'Verified').length}
                        </span>
                    </div>
                    <div className="batch-stat">
                        <span className="batch-stat-label">
                            <span className="batch-stat-dot" style={{ background: 'var(--warning)' }}></span>
                            Processing:
                        </span>
                        <span className="batch-stat-value" style={{ color: 'var(--warning)' }}>
                            {selectedBatch?.processing || signatures.filter(s => s.status === 'Processing').length}
                        </span>
                    </div>
                    <div className="batch-stat">
                        <span className="batch-stat-label">
                            <span className="batch-stat-dot" style={{ background: 'var(--error)' }}></span>
                            Forgeries Detected:
                        </span>
                        <span className="batch-stat-value" style={{ color: 'var(--error)' }}>
                            {selectedBatch?.forgeries || signatures.filter(s => s.status === 'Flagged').length}
                        </span>
                    </div>
                </div>

                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                    Current batch
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-outline" style={{ flex: 1, fontSize: '0.75rem' }} onClick={handleExport}>
                        <Download size={14} />
                        Download Report
                    </button>
                    <button className="btn btn-outline" style={{ flex: 1, fontSize: '0.75rem' }}>
                        View Details
                    </button>
                </div>
            </div>

            {/* Create Batch Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Create New Batch"
                footer={
                    <>
                        <button className="btn btn-outline" onClick={() => setIsModalOpen(false)}>
                            Cancel
                        </button>
                        <button className="btn btn-primary" onClick={handleCreateBatch}>
                            Create Batch
                        </button>
                    </>
                }
            >
                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                        Batch Name
                    </label>
                    <input
                        type="text"
                        className="input"
                        placeholder="Enter batch name..."
                        value={newBatchName}
                        onChange={(e) => setNewBatchName(e.target.value)}
                    />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                        Date Created
                    </label>
                    <input
                        type="date"
                        className="input"
                        defaultValue={new Date().toISOString().slice(0, 10)}
                    />
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                        Notes (Optional)
                    </label>
                    <textarea
                        className="input"
                        rows={3}
                        placeholder="Add notes..."
                    />
                </div>
            </Modal>
        </div>
    );
}
