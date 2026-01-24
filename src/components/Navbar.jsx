import React from 'react';
import { Zap, ChevronDown } from 'lucide-react';

const Navbar = () => {
    return (
        <nav className="navbar">
            <div className="nav-left">
                <div className="nav-logo">
                    <Zap className="logo-icon" />
                </div>
                <div className="nav-divider"></div>
                <ul className="nav-links">
                    <li><a href="#" className="nav-link active">Home</a></li>
                    <li><a href="#" className="nav-link">Product <ChevronDown size={14} /></a></li>
                    <li><a href="#" className="nav-link">AI Technology <ChevronDown size={14} /></a></li>
                    <li><a href="#" className="nav-link">Customers</a></li>
                    <li><a href="#" className="nav-link">Resources <ChevronDown size={14} /></a></li>
                    <li><a href="#" className="nav-link">Pricing</a></li>
                </ul>
            </div>

            <div className="nav-right">
                <a href="#" className="nav-link">Contact sales</a>
                <a href="#" className="nav-link">Sign in</a>
                <a href="#" className="nav-link">View demo</a>
                <button className="nav-cta">Start free trial</button>
            </div>
        </nav>
    );
};

export default Navbar;
