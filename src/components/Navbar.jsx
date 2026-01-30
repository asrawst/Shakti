import React, { useState, useEffect, useRef } from 'react';
import Logo from './Logo';
import { Menu, User, History, LogOut } from 'lucide-react';

const Navbar = ({ user, onLoginClick, onLogoutClick, onAboutClick, onHistoryClick }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleLogout = () => {
        setIsMenuOpen(false);
        onLogoutClick();
    };

    return (
        <nav className="navbar">
            <div className="nav-left">
                <div className="nav-logo">
                    <a href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'inherit' }}>
                        <Logo className="logo-icon" />
                    </a>
                </div>
                <div className="nav-divider"></div>
                <ul className="nav-links">
                    <li><a href="#" className="nav-link active">Home</a></li>
                    <li><a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onAboutClick(); }}>About Us</a></li>
                    <li><a href="#" className="nav-link">Contact Us</a></li>
                </ul>
            </div>

            <div className="nav-right">
                {user ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', position: 'relative' }} ref={menuRef}>
                        <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', marginRight: '0.5rem' }}>
                            {user.email.split('@')[0].charAt(0).toUpperCase() + user.email.split('@')[0].slice(1)}
                        </span>

                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            style={{
                                background: 'rgba(255, 255, 255, 0.1)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                borderRadius: '8px',
                                padding: '0.5rem',
                                color: 'white',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.15)'}
                            onMouseLeave={e => e.target.style.background = 'rgba(255,255,255,0.1)'}
                        >
                            <Menu size={20} />
                        </button>

                        {isMenuOpen && (
                            <div style={{
                                position: 'absolute',
                                top: '100%',
                                right: 0,
                                marginTop: '0.5rem',
                                width: '200px',
                                background: 'rgba(17, 24, 39, 0.95)',
                                backdropFilter: 'blur(16px)',
                                WebkitBackdropFilter: 'blur(16px)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '12px',
                                padding: '0.5rem',
                                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                                zIndex: 100,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.2rem'
                            }}>
                                <button className="menu-item" style={menuItemStyle}>
                                    <User size={16} />
                                    <span>Profile</span>
                                </button>

                                <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '0.2rem 0' }}></div>
                                <button className="menu-item" onClick={handleLogout} style={{ ...menuItemStyle, color: '#ef4444' }}>
                                    <LogOut size={16} />
                                    <span>Sign Out</span>
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <button onClick={onLoginClick} className="nav-btn" style={{ cursor: 'pointer', border: 'none' }}>
                        Admin login
                    </button>
                )}
            </div>
        </nav>
    );
};

const menuItemStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem 1rem',
    background: 'none',
    border: 'none',
    color: '#e2e8f0',
    fontSize: '0.9rem',
    cursor: 'pointer',
    borderRadius: '8px',
    width: '100%',
    textAlign: 'left',
    transition: 'background 0.2s'
};

// Add hover effect using a style tag or class since we verify inline styles effectively
// For simplicity in this replacement, we'll assume basic functionality. 
// Ideally we would add .menu-item:hover to CSS. Let's stick to inline for now but class is cleaner.
// I will keep className="menu-item" and let user know or rely on global CSS if standard.
// Actually, let's inject a small style tag for the hover effect to be safe.

export default Navbar;
