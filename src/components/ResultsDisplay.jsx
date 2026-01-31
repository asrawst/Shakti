import React from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Download } from 'lucide-react';

import MapComponent from './MapComponent';

const ResultsDisplay = ({ data }) => {
    const [showAll, setShowAll] = React.useState(false);
    const [inspectionStatus, setInspectionStatus] = React.useState({});

    if (!data) return null;

    const { summary, anomalies, results } = data; // 'results' contains all items

    // Filter out anomalies from the full list to avoid duplicates if we just append
    const normalItems = results ? results.filter(item => item.risk_class === 'normal') : [];

    // Sort normal items by risk score (descending) to show "almost risky" ones first
    const sortedNormalItems = [...normalItems].sort((a, b) => (b.aggregate_risk_score || 0) - (a.aggregate_risk_score || 0));

    const handleStatusChange = (consumerId, newStatus) => {
        setInspectionStatus(prev => ({
            ...prev,
            [consumerId]: newStatus
        }));
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Initiated': return '#3b82f6'; // Blue
            case 'In Process': return '#f59e0b'; // Amber
            case 'Completed': return '#10b981'; // Green
            default: return 'rgba(255, 255, 255, 0.5)';
        }
    };

    const handleDownloadPDF = () => {
        const doc = new jsPDF();

        // Title
        doc.setFontSize(20);
        doc.text("Electricity Theft Detection Report", 14, 22);

        // Timestamp
        doc.setFontSize(10);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

        // Summary Section
        doc.setFontSize(14);
        doc.text("Summary Statistics", 14, 45);

        const summaryData = [
            ["Grid Health", `${summary.grid_health_score}%`],
            ["Critical Cases", summary.critical_cases],
            ["Anomalies Detected", summary.anomalies_detected],
            ["Est. Revenue Loss", `Rs. ${summary.total_loss_calculated.toString().replace(/,/g, '')}`]
        ];

        autoTable(doc, {
            startY: 50,
            head: [['Metric', 'Value']],
            body: summaryData,
            theme: 'grid',
            headStyles: { fillColor: [41, 128, 185] },
            styles: { fontSize: 10 }
        });

        // Anomalies Table
        if (anomalies && anomalies.length > 0) {
            doc.text("Detected Anomalies", 14, doc.lastAutoTable.finalY + 15);

            const anomalyRows = anomalies.map(item => [
                item.consumer_id,
                item.transformer_id,
                `${((item.aggregate_risk_score || 0) * 100).toFixed(0)}%`,
                item.risk_class,
                inspectionStatus[item.consumer_id] || "Not Started"
            ]);

            autoTable(doc, {
                startY: doc.lastAutoTable.finalY + 20,
                head: [['Consumer ID', 'Transformer ID', 'Risk Score', 'Risk Class', 'Status']],
                body: anomalyRows,
                theme: 'striped',
                headStyles: { fillColor: [231, 76, 60] },
                styles: { fontSize: 9 }
            });
        }

        // Normal Entries Table
        if (results) {
            const normalItems = results.filter(item => item.risk_class === 'normal');
            if (normalItems.length > 0) {
                doc.addPage();
                doc.text("Normal Entries", 14, 20);

                const normalRows = normalItems.map(item => [
                    item.consumer_id,
                    item.transformer_id,
                    `${((item.aggregate_risk_score || 0) * 100).toFixed(0)}%`,
                    item.risk_class
                ]);

                autoTable(doc, {
                    startY: 25,
                    head: [['Consumer ID', 'Transformer ID', 'Risk Score', 'Risk Class']],
                    body: normalRows,
                    theme: 'striped',
                    headStyles: { fillColor: [46, 204, 113] },
                    styles: { fontSize: 9 }
                });
            }
        }

        doc.save("electricity_theft_report.pdf");
    };

    return (
        <div className="results-container">
            <div style={{ position: 'relative', marginBottom: '1.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <h2 className="section-title" style={{ margin: 0 }}>Analysis Report</h2>
                <button
                    onClick={handleDownloadPDF}
                    style={{
                        position: 'absolute',
                        right: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        background: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        padding: '0.5rem 1rem',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '500',
                        fontSize: '0.9rem',
                        transition: 'background 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = '#2563eb'}
                    onMouseOut={(e) => e.currentTarget.style.background = '#3b82f6'}
                >
                    <Download size={16} /> Download PDF
                </button>
            </div>

            {/* Summary Cards */}
            <div className="summary-grid">
                <div className="summary-card health">
                    <h3>Grid Health</h3>
                    <div className="value">{summary.grid_health_score}%</div>
                    <p>Overall System Status</p>
                </div>
                <div className="summary-card critical">
                    <h3>Critical Cases</h3>
                    <div className="value">{summary.critical_cases}</div>
                    <p>Immediate Action Required</p>
                </div>
                <div className="summary-card anomalies">
                    <h3>Anomalies</h3>
                    <div className="value">{summary.anomalies_detected}</div>
                    <p>Total Suspicious Consumers</p>
                </div>
                <div className="summary-card loss">
                    <h3>Est. Loss</h3>
                    <div className="value">₹{summary.total_loss_calculated.toString().replace(/,/g, '')}</div>
                    <p>Potential Revenue Loss</p>
                </div>
            </div>

            {/* Geographic Analysis (Map) */}
            <MapComponent data={data} />

            {/* Anomalies Table */}
            {anomalies && anomalies.length > 0 && (
                <div className="anomalies-section">
                    <h3 className="subsection-title">Detected Anomalies</h3>
                    <div className="table-wrapper">
                        <table className="anomalies-table">
                            <thead>
                                <tr>
                                    <th>Consumer ID</th>
                                    <th>Transformer ID</th>
                                    <th>Risk Score</th>
                                    <th>Risk Class</th>
                                    <th>Inspection Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {anomalies.map((item, index) => (
                                    <tr key={index} className={`risk-${item.risk_class}`}>
                                        <td>{item.consumer_id}</td>
                                        <td>{item.transformer_id}</td>
                                        <td>{((item.aggregate_risk_score || 0) * 100).toFixed(0)}%</td>
                                        <td><span className={`badge ${item.risk_class}`}>{item.risk_class}</span></td>
                                        <td>
                                            {['critical', 'mild'].includes(item.risk_class.toLowerCase()) ? (
                                                <div style={{ position: 'relative' }}>
                                                    <select
                                                        value={inspectionStatus[item.consumer_id] || ""}
                                                        onChange={(e) => handleStatusChange(item.consumer_id, e.target.value)}
                                                        style={{
                                                            background: 'rgba(0, 0, 0, 0.2)',
                                                            border: `1px solid ${getStatusColor(inspectionStatus[item.consumer_id])}`,
                                                            color: inspectionStatus[item.consumer_id] ? getStatusColor(inspectionStatus[item.consumer_id]) : 'rgba(255, 255, 255, 0.7)',
                                                            padding: '0.4rem 0.8rem',
                                                            borderRadius: '6px',
                                                            fontSize: '0.85rem',
                                                            cursor: 'pointer',
                                                            outline: 'none',
                                                            width: '130px'
                                                        }}
                                                    >
                                                        <option value="" disabled>Select Status</option>
                                                        <option value="Initiated">Initiated</option>
                                                        <option value="In Process">In Process</option>
                                                        <option value="Completed">Completed</option>
                                                    </select>
                                                </div>
                                            ) : (
                                                <span style={{ color: 'rgba(255, 255, 255, 0.3)', fontSize: '0.85rem' }}>-</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Show All Toggle */}
            <div className="show-more-container">
                <button
                    className="show-more-btn"
                    onClick={() => setShowAll(!showAll)}
                >
                    {showAll ? "Hide Normal Entries" : "Show All Entries"}
                </button>
            </div>

            {/* Normal / All Other Items Table */}
            {showAll && sortedNormalItems.length > 0 && (
                <div className="anomalies-section normal-section">
                    <h3 className="subsection-title">Normal Entries</h3>
                    <div className="table-wrapper">
                        <table className="anomalies-table normal-table">
                            <thead>
                                <tr>
                                    <th>Consumer ID</th>
                                    <th>Transformer ID</th>
                                    <th>Risk Score</th>
                                    <th>Risk Class</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedNormalItems.map((item, index) => (
                                    <tr key={index} className={`risk-${item.risk_class}`}>
                                        <td>{item.consumer_id}</td>
                                        <td>{item.transformer_id}</td>
                                        <td>{((item.aggregate_risk_score || 0) * 100).toFixed(0)}%</td>
                                        <td><span className={`badge ${item.risk_class}`}>{item.risk_class}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ResultsDisplay;
