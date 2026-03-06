import React, { useEffect } from 'react';
import { X } from 'lucide-react';

const AboutUsModal = ({ onClose }) => {
    useEffect(() => {
        console.log("About Us Modal Mounted");
    }, []);

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
        }}>
            <div style={{
                background: 'rgba(5, 5, 7, 0.6)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '2.5rem',
                borderRadius: '24px',
                width: '90%',
                maxWidth: '800px',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                position: 'relative',
                color: '#e2e8f0'
            }}>
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '1.5rem',
                        right: '1.5rem',
                        background: 'none',
                        border: 'none',
                        color: 'rgba(255,255,255,0.5)',
                        cursor: 'pointer',
                        padding: '0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '50%',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => {
                        e.target.style.background = 'rgba(255,255,255,0.1)';
                        e.target.style.color = 'white';
                    }}
                    onMouseLeave={e => {
                        e.target.style.background = 'none';
                        e.target.style.color = 'rgba(255,255,255,0.5)';
                    }}
                >
                    <X size={24} />
                </button>

                <h2 style={{
                    fontSize: '2rem',
                    marginBottom: '1.5rem',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #a855f7 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    textAlign: 'center'
                }}>About Us</h2>

                <div style={{ fontSize: '1.1rem', lineHeight: '1.7', color: '#e2e8f0', display: 'flex', flexDirection: 'column', gap: '1.5rem', textAlign: 'left' }}>
                    <div>
                        <h3 style={{ color: '#60a5fa', marginBottom: '0.5rem', fontSize: '1.3rem' }}>Why existing systems fall short</h3>
                        <p>Most current electricity theft detection methods depend on manual inspections, fixed rules, or single indicators. These approaches struggle to scale, generate many false positives, and often miss complex or well-hidden cases of non-technical losses.</p>
                    </div>

                    <div>
                        <h3 style={{ color: '#60a5fa', marginBottom: '0.5rem', fontSize: '1.3rem' }}>Our approach</h3>
                        <p>This system is built using a research-driven, multi-layer anomaly detection framework. Rather than relying on one signal, it analyzes electricity usage from multiple perspectives to capture different forms of suspicious behavior and reduce blind spots.</p>
                    </div>

                    <div>
                        <h3 style={{ color: '#60a5fa', marginBottom: '0.5rem', fontSize: '1.3rem' }}>How the system works</h3>
                        <p>Smart-meter consumption patterns are analyzed over time to detect abnormal changes. Consumers are evaluated relative to nearby peers connected to the same transformer, providing local context. Transformer-level loss analysis captures grid-side irregularities, while voltage and power-quality signals act as physical indicators. Seasonal and contextual factors are applied to avoid false alarms.</p>
                    </div>

                    <div>
                        <h3 style={{ color: '#60a5fa', marginBottom: '0.5rem', fontSize: '1.3rem' }}>What makes it different</h3>
                        <p>All signals are normalized and combined into a single risk score that prioritizes a small set of cases for inspection. The system does not label theft; it supports explainable, risk-based decision making with humans in the loop. Location-based analysis further highlights geographic hotspots for efficient inspection planning.</p>
                    </div>

                    <div>
                        <h3 style={{ color: '#60a5fa', marginBottom: '0.5rem', fontSize: '1.3rem' }}>The problem we solve</h3>
                        <p>The system helps utilities move from reactive checks to targeted, data-driven inspections, reducing non-technical losses and improving grid visibility while maintaining transparency and control.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AboutUsModal;
