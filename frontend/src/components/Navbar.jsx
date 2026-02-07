import React, { useState, useEffect, useRef } from 'react';
import Logo from './Logo';
import { Menu, User, History, LogOut, Github } from 'lucide-react';
import '../navbar_menu.css';

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

    const handleMobileLinkClick = (action) => {
        setIsMenuOpen(false);
        action();
    };

    return (
        <nav className="navbar">
            <div className="nav-left">
                <div className="nav-logo">
                    <a href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'inherit' }}>
                        <Logo className="logo-icon" />
                    </a>
                </div>
                {/* Desktop Links - Hidden on Mobile via CSS */}
                <div className="desktop-nav">
                    <div className="nav-divider"></div>
                    <ul className="nav-links">
                        <li><a href="#" className="nav-link active">Home</a></li>
                        <li><a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onAboutClick(); }}>About Us</a></li>
                        <li>
                            <a
                                href="https://github.com/asrawst/Shakti.git"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="nav-link"
                                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                            >
                                <Github size={18} />
                                GitHub
                            </a>
                        </li>
                    </ul>
                </div>
            </div>

            <div className="nav-right">
                {/* Desktop Action Button - Hidden on Mobile via CSS if needed, or handled via menu */}
                <div className="desktop-action">
                    {user ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
                                {user.displayName || user.email?.split('@')[0]}
                            </span>
                        </div>
                    ) : (
                        <button onClick={onLoginClick} className="nav-btn">
                            Admin login
                        </button>
                    )}
                </div>

                {/* Mobile Menu Toggle / User Menu Toggle */}
                <div className="menu-toggle-container" ref={menuRef}>
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="menu-toggle-btn"
                        style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '8px',
                            padding: '0.5rem',
                            color: 'white',
                            cursor: 'pointer',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s',
                        }}
                    >
                        <Menu size={20} />
                    </button>

                    {isMenuOpen && (
                        <div className="floating-menu">
                            <div className="menu-list">
                                {/* Mobile Links - Only visible in menu */}
                                <div className="mobile-only-links">
                                    <button className="menu-item-float" onClick={() => setIsMenuOpen(false)}>
                                        <div className="menu-item-title">Home</div>
                                    </button>
                                    <button className="menu-item-float" onClick={() => handleMobileLinkClick(onAboutClick)}>
                                        <div className="menu-item-title">About Us</div>
                                    </button>
                                    <a href="https://github.com/asrawst/Shakti.git"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="menu-item-float"
                                        onClick={() => setIsMenuOpen(false)}
                                        style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', color: '#e2e8f0' }}
                                    >
                                        <div className="menu-item-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Github size={18} />
                                            GitHub
                                        </div>
                                    </a>
                                    <div className="menu-divider" style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '0.5rem 0' }}></div>
                                </div>

                                {user ? (
                                    <>
                                        <div className="menu-item-float" style={{ cursor: 'default', opacity: 0.7 }}>
                                            <div className="menu-item-desc">Signed in as {user.displayName || user.email?.split('@')[0]}</div>
                                        </div>
                                        <button className="menu-item-float" onClick={handleLogout}>
                                            <div className="menu-item-title" style={{ color: '#ef4444' }}><LogOut size={16} /> Sign Out</div>
                                        </button>
                                    </>
                                ) : (
                                    <button className="menu-item-float" onClick={() => handleMobileLinkClick(onLoginClick)}>
                                        <div className="menu-item-title" style={{ color: '#3b82f6' }}><User size={16} /> Admin Login</div>
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
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
