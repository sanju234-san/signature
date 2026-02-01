import { useNavigate } from 'react-router-dom';
import { Shield, Upload, BarChart3, Zap, CheckCircle, AlertTriangle, TrendingUp } from 'lucide-react';

export default function Home() {
    const navigate = useNavigate();

    const features = [
        {
            icon: <Upload size={28} />,
            title: 'Easy Upload',
            description: 'Drag & drop signature images for instant AI-powered analysis'
        },
        {
            icon: <Zap size={28} />,
            title: 'Fast Processing',
            description: 'Get verification results in seconds with our advanced ML models'
        },
        {
            icon: <BarChart3 size={28} />,
            title: 'Detailed Analytics',
            description: 'Comprehensive feature breakdown including stroke, fluidity & angle'
        },
        {
            icon: <Shield size={28} />,
            title: 'Secure & Reliable',
            description: 'Enterprise-grade security with local data persistence'
        }
    ];

    const stats = [
        { value: '99.2%', label: 'Accuracy Rate', icon: <CheckCircle size={20} /> },
        { value: '< 2s', label: 'Analysis Time', icon: <Zap size={20} /> },
        { value: '10K+', label: 'Signatures Processed', icon: <TrendingUp size={20} /> }
    ];

    return (
        <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
            {/* Hero Section */}
            <div style={{
                background: 'linear-gradient(135deg, var(--primary) 0%, #2d5a87 100%)',
                padding: '4rem 2rem',
                textAlign: 'center',
                color: 'white'
            }}>
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.75rem',
                        marginBottom: '1.5rem'
                    }}>
                        <Shield size={40} />
                        <span style={{ fontSize: '2rem', fontWeight: 700 }}>SigVerify AI</span>
                    </div>

                    <h1 style={{
                        fontSize: '2.5rem',
                        fontWeight: 700,
                        marginBottom: '1rem',
                        lineHeight: 1.2
                    }}>
                        AI-Powered Signature Verification
                    </h1>

                    <p style={{
                        fontSize: '1.125rem',
                        opacity: 0.9,
                        marginBottom: '2rem',
                        maxWidth: '600px',
                        margin: '0 auto 2rem'
                    }}>
                        Detect forged signatures instantly with our advanced machine learning technology.
                        Upload, analyze, and verify signatures with confidence.
                    </p>

                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button
                            className="btn"
                            style={{
                                background: 'white',
                                color: 'var(--primary)',
                                padding: '0.875rem 2rem',
                                fontSize: '1rem',
                                fontWeight: 600,
                                borderRadius: '0.5rem'
                            }}
                            onClick={() => navigate('/dashboard')}
                        >
                            Go to Dashboard
                        </button>
                        <button
                            className="btn"
                            style={{
                                background: 'rgba(255,255,255,0.15)',
                                color: 'white',
                                padding: '0.875rem 2rem',
                                fontSize: '1rem',
                                fontWeight: 600,
                                borderRadius: '0.5rem',
                                border: '2px solid rgba(255,255,255,0.3)'
                            }}
                            onClick={() => navigate('/analysis')}
                        >
                            Try Demo Analysis
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Section */}
            <div style={{
                background: 'white',
                padding: '2rem',
                borderBottom: '1px solid var(--border)'
            }}>
                <div style={{
                    maxWidth: '800px',
                    margin: '0 auto',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '2rem',
                    textAlign: 'center'
                }}>
                    {stats.map((stat, i) => (
                        <div key={i}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                                marginBottom: '0.5rem',
                                color: 'var(--primary)'
                            }}>
                                {stat.icon}
                                <span style={{ fontSize: '2rem', fontWeight: 700 }}>{stat.value}</span>
                            </div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                {stat.label}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Features Section */}
            <div style={{ padding: '3rem 2rem', maxWidth: '1000px', margin: '0 auto' }}>
                <h2 style={{
                    textAlign: 'center',
                    marginBottom: '2.5rem',
                    fontSize: '1.75rem',
                    fontWeight: 600
                }}>
                    Key Features
                </h2>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '1.5rem'
                }}>
                    {features.map((feature, i) => (
                        <div
                            key={i}
                            className="card"
                            style={{
                                padding: '1.5rem',
                                textAlign: 'center',
                                transition: 'transform 0.2s, box-shadow 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-4px)';
                                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '';
                            }}
                        >
                            <div style={{
                                width: '56px',
                                height: '56px',
                                borderRadius: '12px',
                                background: 'linear-gradient(135deg, var(--primary-light) 0%, rgba(30, 58, 95, 0.1) 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 1rem',
                                color: 'var(--primary)'
                            }}>
                                {feature.icon}
                            </div>
                            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                                {feature.title}
                            </h3>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* CTA Section */}
            <div style={{
                background: 'var(--primary)',
                padding: '3rem 2rem',
                textAlign: 'center',
                color: 'white'
            }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem' }}>
                    Ready to Verify Signatures?
                </h2>
                <p style={{ opacity: 0.9, marginBottom: '1.5rem', maxWidth: '500px', margin: '0 auto 1.5rem' }}>
                    Start uploading signatures now and get instant AI-powered verification results.
                </p>
                <button
                    className="btn"
                    style={{
                        background: 'white',
                        color: 'var(--primary)',
                        padding: '0.875rem 2rem',
                        fontSize: '1rem',
                        fontWeight: 600,
                        borderRadius: '0.5rem'
                    }}
                    onClick={() => navigate('/dashboard')}
                >
                    Get Started
                </button>
            </div>

            {/* Footer */}
            <div style={{
                padding: '1.5rem 2rem',
                textAlign: 'center',
                fontSize: '0.875rem',
                color: 'var(--text-secondary)',
                borderTop: '1px solid var(--border)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <Shield size={16} />
                    <span>SigVerify AI</span>
                    <span style={{ opacity: 0.5 }}>•</span>
                    <span>AI-Powered Signature Verification System</span>
                </div>
            </div>
        </div>
    );
}
