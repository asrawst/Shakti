import React from 'react';

const ResultsDisplay = ({ data }) => {
    const [showAll, setShowAll] = React.useState(false);

    if (!data) return null;

    const { summary, anomalies, results } = data; // 'results' contains all items

    // Filter out anomalies from the full list to avoid duplicates if we just append
    const normalItems = results ? results.filter(item => item.risk_class === 'normal') : [];

    // Sort normal items by risk score (descending) to show "almost risky" ones first
    const sortedNormalItems = [...normalItems].sort((a, b) => (b.aggregate_risk_score || 0) - (a.aggregate_risk_score || 0));

    return (
        <div className="results-container">
            <h2 className="section-title">Analysis Report</h2>

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
                    <div className="value">${summary.total_loss_calculated}</div>
                    <p>Potential Revenue Loss</p>
                </div>
            </div>

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
                                </tr>
                            </thead>
                            <tbody>
                                {anomalies.map((item, index) => (
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
