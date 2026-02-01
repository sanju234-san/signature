import { NavLink } from 'react-router-dom';
import { PenTool, ChevronDown } from 'lucide-react';

export default function Navbar({ userName = 'Dr. A. Chen' }) {
    const tabs = [
        { path: '/', label: 'Dashboard' },
        { path: '/batches', label: 'Cases' },
        { path: '/analysis', label: 'Analysis' },
        { path: '/settings', label: 'Settings' },
    ];

    const initials = userName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    return (
        <nav className="navbar">
            <div className="navbar-brand">
                <PenTool size={24} />
                <span>SigVerify AI</span>
            </div>

            <div className="navbar-tabs">
                {tabs.map((tab) => (
                    <NavLink
                        key={tab.path}
                        to={tab.path}
                        className={({ isActive }) =>
                            `navbar-tab ${isActive ? 'active' : ''}`
                        }
                    >
                        {tab.label}
                    </NavLink>
                ))}
            </div>

            <div className="navbar-user">
                <div className="navbar-avatar">{initials}</div>
                <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{userName}</span>
                <ChevronDown size={16} style={{ color: 'var(--text-secondary)' }} />
            </div>
        </nav>
    );
}
