import React from 'react';
import { X } from 'lucide-react';
import {
    PieChart, Pie, Cell,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer
} from 'recharts';

const TransformerStatsModal = ({ isOpen, onClose, data }) => {
    if (!isOpen || !data || data.length === 0) return null;

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#a855f7', '#ec4899', '#f43f5e'];

    return (
        <div className="modal-overlay" style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)', display: 'flex',
            justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
            <div className="modal-content" style={{
                background: '#1e293b', padding: '2rem', borderRadius: '12px',
                width: '90%', maxWidth: '1000px', maxHeight: '90vh', overflowY: 'auto',
                border: '1px solid rgba(255, 255, 255, 0.1)', color: 'white', position: 'relative'
            }}>
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute', top: '1rem', right: '1rem',
                        background: 'none', border: 'none', color: 'rgba(255, 255, 255, 0.6)',
                        cursor: 'pointer'
                    }}
                >
                    <X size={24} />
                </button>

                <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
                    Transformer Risk Analysis
                </h2>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                    {/* PIE CHART */}
                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px' }}>
                        <h3 style={{ textAlign: 'center', marginBottom: '1rem', fontSize: '1.1rem' }}>Anomaly Distribution</h3>
                        <div style={{ height: '300px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={data}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        dataKey="anomalies_detected"
                                        nameKey="transformer_id"
                                    >
                                        {data.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* BAR CHART */}
                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px' }}>
                        <h3 style={{ textAlign: 'center', marginBottom: '1rem', fontSize: '1.1rem' }}>Anomalies by Transformer</h3>
                        <div style={{ height: '300px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={data}
                                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                    <XAxis dataKey="transformer_id" stroke="rgba(255,255,255,0.6)" />
                                    <YAxis stroke="rgba(255,255,255,0.6)" />
                                    <Tooltip cursor={{ fill: 'rgba(255,255,255,0.1)' }} contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155' }} />
                                    <Legend />
                                    <Bar dataKey="anomalies_detected" name="Anomalies" fill="#8884d8">
                                        {data.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* TABLE */}
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px' }}>
                    <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Detailed Data</h3>
                    <div className="table-wrapper">
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                            <thead>
                                <tr style={{ background: 'rgba(255,255,255,0.05)', textAlign: 'left' }}>
                                    <th style={{ padding: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Transformer ID</th>
                                    <th style={{ padding: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Count of Anomalies</th>
                                    <th style={{ padding: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((item, index) => (
                                    <tr key={index} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <td style={{ padding: '0.75rem' }}>{item.transformer_id}</td>
                                        <td style={{ padding: '0.75rem' }}>{item.anomalies_detected}</td>
                                        <td style={{ padding: '0.75rem' }}>
                                            <span style={{
                                                background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5',
                                                padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem'
                                            }}>
                                                High Risk
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default TransformerStatsModal;
