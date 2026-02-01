import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Check, X, ZoomIn, ZoomOut, Search, Flag } from 'lucide-react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, AreaChart, Area } from 'recharts';
import Navbar from '../components/Navbar';
import { useToast } from '../components/Toast';
import { getSignature, saveSignature, getAllSignatures } from '../utils/storage';

export default function Analysis() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [signature, setSignature] = useState(null);
    const [zoom, setZoom] = useState(1);
    const { showSaving, showSaved, showError } = useToast();

    useEffect(() => {
        loadSignature();
    }, [searchParams]);

    const loadSignature = async () => {
        const id = searchParams.get('id');
        if (id) {
            const sig = await getSignature(id);
            if (sig) {
                setSignature(sig);
                return;
            }
        }

        // Load first signature if no ID specified
        const allSigs = await getAllSignatures();
        if (allSigs.length > 0) {
            setSignature(allSigs[0]);
        } else {
            // Create demo signature
            setSignature({
                id: 'SIG-20231026-001',
                name: 'John Doe',
                timestamp: '2023-10-26T10:45:00.000Z',
                classification: 'Authentic',
                confidence: 98,
                imageData: null,
                fileName: 'john_doe_sig_001.png',
                uploadedBy: 'System',
                strokePressure: { start: 85, mid: 92, end: 88 },
                fluidity: 95,
                slantAngle: 15,
                notes: ''
            });
        }
    };

    const handleUpdateSignature = async (field, value) => {
        if (!signature) return;

        const loadingId = showSaving();
        try {
            const updated = { ...signature, [field]: value };
            await saveSignature(updated);
            setSignature(updated);
            showSaved(loadingId);
        } catch (error) {
            showError('Error updating signature');
        }
    };

    const handleApprove = async () => {
        await handleUpdateSignature('classification', 'Authentic');
        await handleUpdateSignature('status', 'Verified');
    };

    const handleFlag = async () => {
        await handleUpdateSignature('classification', 'Forged');
        await handleUpdateSignature('status', 'Flagged');
    };

    // Radar chart data for stroke pressure - pentagon shape
    const pressureData = [
        { axis: 'Start', value: signature?.strokePressure?.start || 85, fullMark: 100 },
        { axis: '', value: 90, fullMark: 100 },
        { axis: 'Mid', value: signature?.strokePressure?.mid || 92, fullMark: 100 },
        { axis: '', value: 88, fullMark: 100 },
        { axis: 'End', value: signature?.strokePressure?.end || 88, fullMark: 100 },
    ];

    // Fluidity wave data
    const fluidityData = [
        { x: 0, y1: 30, y2: 50 },
        { x: 1, y1: 45, y2: 35 },
        { x: 2, y1: 35, y2: 55 },
        { x: 3, y1: 50, y2: 40 },
        { x: 4, y1: 40, y2: 60 },
        { x: 5, y1: 55, y2: 45 },
        { x: 6, y1: 45, y2: 55 },
        { x: 7, y1: 60, y2: 50 },
    ];

    const isAuthentic = signature?.classification === 'Authentic';
    const confidence = signature?.confidence || 98;

    const formatDate = (isoString) => {
        if (!isoString) return 'Oct 26, 2023, 10:45 AM';
        const date = new Date(isoString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
            <Navbar />

            <div style={{ padding: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
                <div className="analysis-grid">
                    {/* Left Column - Uploaded Signature */}
                    <div className="signature-viewer">
                        <h3 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: 600 }}>Uploaded Signature</h3>

                        <div
                            className="signature-canvas"
                            style={{
                                minHeight: '280px',
                                background: `
                  linear-gradient(90deg, #f0f0f0 1px, transparent 1px),
                  linear-gradient(#f0f0f0 1px, transparent 1px)
                `,
                                backgroundSize: '25px 25px',
                                backgroundColor: '#fafafa',
                                position: 'relative'
                            }}
                        >
                            <div style={{
                                transform: `scale(${zoom})`,
                                transformOrigin: 'center',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '100%',
                                height: '100%'
                            }}>
                                {signature?.imageData ? (
                                    <img
                                        src={signature.imageData}
                                        alt={signature.name}
                                        style={{ maxWidth: '90%', maxHeight: '240px' }}
                                    />
                                ) : (
                                    <span style={{
                                        fontFamily: "'Brush Script MT', 'Segoe Script', cursive",
                                        fontSize: '4rem',
                                        color: '#1e90ff',
                                        fontWeight: 400,
                                        letterSpacing: '2px'
                                    }}>
                                        {signature?.name || 'John Doe'}
                                    </span>
                                )}
                            </div>

                            {/* Selection box with handles */}
                            <div style={{
                                position: 'absolute',
                                left: '10%',
                                right: '10%',
                                top: '15%',
                                bottom: '15%',
                                border: '2px solid #3b82f6',
                                pointerEvents: 'none'
                            }}>
                                {/* Corner handles */}
                                {['top-left', 'top-right', 'bottom-left', 'bottom-right', 'top-center', 'bottom-center'].map((pos) => {
                                    const positions = {
                                        'top-left': { left: '-5px', top: '-5px' },
                                        'top-right': { right: '-5px', top: '-5px' },
                                        'bottom-left': { left: '-5px', bottom: '-5px' },
                                        'bottom-right': { right: '-5px', bottom: '-5px' },
                                        'top-center': { left: 'calc(50% - 5px)', top: '-5px' },
                                        'bottom-center': { left: 'calc(50% - 5px)', bottom: '-5px' },
                                    };
                                    return (
                                        <div
                                            key={pos}
                                            style={{
                                                position: 'absolute',
                                                width: '10px',
                                                height: '10px',
                                                background: 'white',
                                                border: '2px solid #3b82f6',
                                                borderRadius: '2px',
                                                ...positions[pos]
                                            }}
                                        />
                                    );
                                })}
                            </div>
                        </div>

                        {/* Signature Details */}
                        <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                            <div style={{ marginBottom: '0.25rem' }}>
                                <strong>Uploaded:</strong> {formatDate(signature?.timestamp)}
                            </div>
                            <div>
                                <strong>File:</strong> {signature?.fileName || 'john_doe_sig_001.png'}
                            </div>
                        </div>

                        {/* Zoom Controls */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            alignItems: 'center',
                            gap: '0.25rem',
                            marginTop: '1rem'
                        }}>
                            <button className="zoom-btn" onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}>
                                −
                            </button>
                            <button className="zoom-btn">
                                <Search size={14} />
                            </button>
                            <button className="zoom-btn" onClick={() => setZoom(z => Math.min(2, z + 0.1))}>
                                +
                            </button>
                        </div>
                    </div>

                    {/* Right Column - AI Analysis Result */}
                    <div>
                        <h3 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: 600 }}>AI Analysis Result</h3>

                        {/* Result Card */}
                        <div
                            style={{
                                background: isAuthentic
                                    ? 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)'
                                    : 'linear-gradient(135deg, #fef2f2 0%, #fecaca 100%)',
                                borderRadius: '0.75rem',
                                padding: '1.25rem',
                                marginBottom: '1.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    background: isAuthentic ? '#22c55e' : '#ef4444',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white'
                                }}>
                                    {isAuthentic ? <Check size={22} /> : <X size={22} />}
                                </div>
                                <span style={{
                                    fontSize: '1.25rem',
                                    fontWeight: 600,
                                    color: 'var(--text-primary)'
                                }}>
                                    {isAuthentic ? 'Likely Authentic' : 'Likely Forged'}
                                </span>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{
                                    fontSize: '2rem',
                                    fontWeight: 700,
                                    color: isAuthentic ? '#22c55e' : '#ef4444'
                                }}>
                                    {confidence}%
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                    Confidence
                                </div>
                            </div>
                        </div>

                        {/* Detailed Feature Breakdown */}
                        <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '1rem' }}>
                            Detailed Feature Breakdown
                        </h4>

                        <div className="feature-grid">
                            {/* Stroke Pressure Analysis */}
                            <div className="feature-card">
                                <div className="feature-title">Stroke Pressure Analysis</div>
                                <div className="feature-chart" style={{ height: '100px' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadarChart data={pressureData} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                                            <PolarGrid stroke="#e5e7eb" />
                                            <PolarAngleAxis dataKey="axis" tick={{ fontSize: 8 }} />
                                            <Radar
                                                dataKey="value"
                                                stroke="#10b981"
                                                fill="#10b981"
                                                fillOpacity={0.3}
                                            />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="feature-score">
                                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>Progress</span>
                                    <span style={{ fontWeight: 600, fontSize: '0.7rem' }}>High (92%)</span>
                                </div>
                                <div className="progress-bar" style={{ background: '#e5e7eb', height: '6px', borderRadius: '3px' }}>
                                    <div style={{ width: '92%', height: '100%', background: '#22c55e', borderRadius: '3px' }}></div>
                                </div>
                            </div>

                            {/* Fluidity & Speed */}
                            <div className="feature-card">
                                <div className="feature-title">Fluidity & Speed</div>
                                <div className="feature-chart" style={{ height: '100px' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={fluidityData} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                                            <Area
                                                type="monotone"
                                                dataKey="y1"
                                                stroke="#60a5fa"
                                                fill="#60a5fa"
                                                fillOpacity={0.2}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="y2"
                                                stroke="#1e3a5f"
                                                fill="#1e3a5f"
                                                fillOpacity={0.2}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="feature-score">
                                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>Progress</span>
                                    <span style={{ fontWeight: 600, fontSize: '0.7rem' }}>Consistent (95%)</span>
                                </div>
                                <div className="progress-bar" style={{ background: '#e5e7eb', height: '6px', borderRadius: '3px' }}>
                                    <div style={{ width: '95%', height: '100%', background: '#3b82f6', borderRadius: '3px' }}></div>
                                </div>
                            </div>

                            {/* Slant & Angle */}
                            <div className="feature-card">
                                <div className="feature-title">Slant & Angle</div>
                                <div className="feature-chart" style={{ height: '100px' }}>
                                    <svg viewBox="0 0 120 100" style={{ width: '100%', height: '100%' }}>
                                        {/* Outer circle */}
                                        <circle cx="60" cy="50" r="35" fill="none" stroke="#e5e7eb" strokeWidth="2" />
                                        {/* Inner decorative circles */}
                                        <circle cx="60" cy="50" r="25" fill="none" stroke="#e5e7eb" strokeWidth="1" />
                                        <circle cx="60" cy="50" r="15" fill="none" stroke="#e5e7eb" strokeWidth="1" />
                                        {/* Crosshairs */}
                                        <line x1="60" y1="10" x2="60" y2="90" stroke="#e5e7eb" strokeWidth="1" />
                                        <line x1="20" y1="50" x2="100" y2="50" stroke="#e5e7eb" strokeWidth="1" />
                                        {/* Angle indicator needle */}
                                        <line
                                            x1="60"
                                            y1="50"
                                            x2="60"
                                            y2="18"
                                            stroke="#f59e0b"
                                            strokeWidth="3"
                                            strokeLinecap="round"
                                            transform="rotate(15, 60, 50)"
                                        />
                                        {/* Center dot */}
                                        <circle cx="60" cy="50" r="4" fill="#f59e0b" />
                                        {/* Right label */}
                                        <text x="100" y="35" fontSize="8" fill="#6b7280">Right (15°)</text>
                                    </svg>
                                </div>
                                <div className="feature-score">
                                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>Progress</span>
                                    <span style={{ fontWeight: 600, fontSize: '0.7rem' }}>Stable (97%)</span>
                                </div>
                                <div className="progress-bar" style={{ background: '#e5e7eb', height: '6px', borderRadius: '3px' }}>
                                    <div style={{ width: '97%', height: '100%', background: '#f59e0b', borderRadius: '3px' }}></div>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                            <button
                                className="btn"
                                style={{
                                    flex: 1,
                                    background: '#22c55e',
                                    color: 'white',
                                    padding: '0.875rem 1.5rem',
                                    fontSize: '0.9375rem',
                                    fontWeight: 500,
                                    borderRadius: '0.5rem'
                                }}
                                onClick={handleApprove}
                            >
                                Approve Signature
                            </button>
                            <button
                                className="btn"
                                style={{
                                    flex: 1,
                                    background: '#ef4444',
                                    color: 'white',
                                    padding: '0.875rem 1.5rem',
                                    fontSize: '0.9375rem',
                                    fontWeight: 500,
                                    borderRadius: '0.5rem'
                                }}
                                onClick={handleFlag}
                            >
                                Flag for Review
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom dark section for visual match */}
            <div style={{
                background: 'var(--primary)',
                height: '60px',
                marginTop: '2rem'
            }}></div>
        </div>
    );
}
