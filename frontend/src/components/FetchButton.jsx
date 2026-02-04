import React from 'react';

const FetchButton = ({ onClick, disabled, isAnalyzed }) => {
    return (
        <div className="action-container">
            <button
                className={`fetch-btn ${disabled ? 'disabled' : ''}`}
                onClick={onClick}
                disabled={disabled}
            >
                {disabled ? 'Processing...' : isAnalyzed ? 'Analysed!' : 'Fetch & Analyze Data'}
            </button>
        </div>
    );
};

export default FetchButton;
