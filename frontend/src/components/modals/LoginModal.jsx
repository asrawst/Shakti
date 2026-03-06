import React, { useState } from 'react';
import { X } from 'lucide-react';
// import { auth } from '../firebaseConfig';
// import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

const LoginModal = ({ onClose, onLoginSuccess }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');

    const [loading, setLoading] = useState(false);
    // const [isSignUp, setIsSignUp] = useState(false); // Removed

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Simulate network delay
        setTimeout(() => {
            if (username === 'Admin' && password === 'Admin') {
                const mockUser = {
                    uid: 'dummy-admin-123',
                    email: 'admin@shakti.com',
                    displayName: 'Admin'
                };
                onLoginSuccess(mockUser);
                onClose();
            } else {
                setError("Invalid Credentials. Please use Username: 'Admin' and Password: 'Admin'");
                setLoading(false);
            }
        }, 800);
    };

    return (
        <div className="modal-overlay" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
        }}>
            <div className="modal-content" style={{
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
                padding: '2rem',
                width: '400px',
                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', color: 'white' }}>
                    <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600' }}>
                        Admin Login
                    </h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>

                {error && <p style={{ color: '#ef4444', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</p>}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }}>Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            style={{
                                padding: '0.75rem',
                                borderRadius: '8px',
                                border: '1px solid rgba(255,255,255,0.1)',
                                background: 'rgba(0,0,0,0.2)',
                                color: 'white',
                                fontSize: '1rem'
                            }}
                            placeholder="Admin"
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }}>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            style={{
                                padding: '0.75rem',
                                borderRadius: '8px',
                                border: '1px solid rgba(255,255,255,0.1)',
                                background: 'rgba(0,0,0,0.2)',
                                color: 'white',
                                fontSize: '1rem'
                            }}
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            marginTop: '1rem',
                            padding: '0.75rem',
                            borderRadius: '9999px',
                            border: 'none',
                            background: 'linear-gradient(135deg, #3b82f6 0%, #a855f7 100%)',
                            color: 'white',
                            fontSize: '1rem',
                            fontWeight: '600',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            opacity: loading ? 0.7 : 1,
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                        }}
                    >
                        {loading ? 'Processing...' : 'Login'}
                    </button>
                    {/* Sign Up section removed */}
                </form>
            </div>
        </div>
    );
};

export default LoginModal;
