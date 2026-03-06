import React from 'react';
import Logo from '../common/Logo';
import { Github, Twitter, Linkedin, Mail } from 'lucide-react';

const Footer = ({ onAboutClick }) => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="footer">
            <div className="footer-wide-container">
                <div className="footer-grid">
                    {/* Brand Section */}
                    <div className="footer-brand">
                        <div className="footer-logo">
                            <Logo className="logo-icon-footer" />
                        </div>
                        <p className="footer-tagline">
                            Empowering the grid with AI-driven electricity theft detection.
                            Secure, efficient, and transparent energy for everyone.
                        </p>
                    </div>

                    {/* Links Sections */}
                    <div className="footer-links-group">
                        <h4 className="footer-heading">Explore</h4>
                        <ul className="footer-links">
                            <li><a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Home</a></li>
                            <li><a href="#" onClick={(e) => { e.preventDefault(); onAboutClick(); }}>About Us</a></li>
                            <li><a href="#upload-section" onClick={(e) => {
                                e.preventDefault();
                                document.getElementById('upload-section')?.scrollIntoView({ behavior: 'smooth' });
                            }}>Analyze Data</a></li>
                        </ul>
                    </div>

                    <div className="footer-links-group">
                        <h4 className="footer-heading">Resources</h4>
                        <ul className="footer-links">
                            <li><a href="/sample_data/sample_dataset.csv">Sample Dataset</a></li>
                            <li><a href="https://github.com/asrawst/Shakti.git" target="_blank" rel="noopener noreferrer">Documentation</a></li>
                            <li><a href="https://github.com/asrawst/Shakti.git" target="_blank" rel="noopener noreferrer">API Reference</a></li>
                        </ul>
                    </div>

                    <div className="footer-links-group">
                        <h4 className="footer-heading">Connect</h4>
                        <ul className="footer-social">
                            <li>
                                <a href="https://github.com/asrawst/Shakti.git" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
                                    <Github size={20} />
                                </a>
                            </li>
                            {/* Placeholders for other socials to match inspiration layout */}
                            <li>
                                <a href="#" onClick={e => e.preventDefault()} aria-label="LinkedIn">
                                    <Linkedin size={20} />
                                </a>
                            </li>
                            <li>
                                <a href="#" onClick={e => e.preventDefault()} aria-label="Twitter">
                                    <Twitter size={20} />
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="footer-bottom">
                    <p>&copy; {currentYear} Shakti. All rights reserved.</p>
                    <div className="footer-legal">
                        <a href="#" onClick={e => e.preventDefault()}>Privacy Policy</a>
                        <span className="separator">•</span>
                        <a href="#" onClick={e => e.preventDefault()}>Terms of Service</a>
                    </div>
                    <div className="footer-credit">
                        System by <span style={{ color: 'var(--accent-blue)' }}>Team Jesters</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
