import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';

const UploadBlock = ({
    title,
    description,
    icon,
    details,
    onFileUpload,
}) => {
    const [dragActive, setDragActive] = useState(false);
    const [file, setFile] = useState(null);
    const [showInfo, setShowInfo] = useState(false);
    const inputRef = useRef(null);

    const handleDrag = function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = function (e) {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
            onFileUpload(e.dataTransfer.files[0]);
        }
    };

    const handleChange = function (e) {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            onFileUpload(e.target.files[0]);
        }
    };

    const onButtonClick = () => {
        if (!showInfo) {
            inputRef.current.click();
        }
    };

    const toggleInfo = (e) => {
        e.stopPropagation();
        setShowInfo(!showInfo);
    }

    return (
        <div
            className={`upload-card ${dragActive ? 'drag-active' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={onButtonClick}
            style={{ position: 'relative' }}
        >
            {showInfo ? (
                // Detailed Info View
                <div className="info-content">
                    <h4 className="info-heading">Description</h4>
                    <p className="info-text">{details.text}</p>

                    <h4 className="info-heading">Required Columns</h4>
                    <ul className="info-list">
                        {details.columns.map((col, i) => (
                            <li key={i}>{col}</li>
                        ))}
                    </ul>

                    <button className="info-close" onClick={toggleInfo}>Close</button>
                </div>
            ) : (
                // Standard Upload View
                <>
                    {/* Info Icon */}
                    <div
                        className="info-icon"
                        onClick={toggleInfo}
                        title="More info"
                    >
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="16" x2="12" y2="12" />
                            <line x1="12" y1="8" x2="12.01" y2="8" />
                        </svg>
                    </div>

                    <input
                        ref={inputRef}
                        type="file"
                        className="file-input-hidden"
                        onChange={handleChange}
                        accept=".csv,.json"
                    />

                    {/* Dynamic Icon based on type */}
                    {icon === 'meter' && (
                        <svg className="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                        </svg>
                    )}
                    {icon === 'map' && (
                        <svg className="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M9 20l-5.447 2.724A1 1 0 012 21.724V6.276a1 1 0 01.553-.894l5.447-2.724 6 3 5.447-2.724A1 1 0 0121 3.276v6.276" />
                            <path d="M15 11l6 3" />
                            <line x1="9" y1="2" x2="9" y2="22" />
                            <line x1="15" y1="11" x2="15" y2="22" />
                        </svg>
                    )}
                    {icon === 'transformer' && (
                        <svg className="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z" />
                            <polyline points="13 2 13 9 20 9" />
                        </svg>
                    )}
                    {icon === 'voltage' && (
                        <svg className="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>
                    )}
                    {icon === 'weather' && (
                        <svg className="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M4 14.899A7 7 0 1115.71 8h1.79a4.5 4.5 0 012.5 8.242" />
                        </svg>
                    )}

                    <h3 className="upload-label">{title}</h3>
                    <p className="upload-desc">{description}</p>

                    {file && (
                        <div className="file-status">
                            <span className="file-name">{file.name}</span>
                            <span className="file-remove" onClick={(e) => { e.stopPropagation(); setFile(null); }}>×</span>
                        </div>
                    )}

                    {/* Upload CSV Button Visual */}
                    <div className="upload-btn-visual">
                        Upload CSV
                    </div>
                </>
            )}
        </div>
    );
};

UploadBlock.propTypes = {
    title: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    icon: PropTypes.string.isRequired,
    onFileUpload: PropTypes.func.isRequired,
    details: PropTypes.shape({
        text: PropTypes.string,
        columns: PropTypes.arrayOf(PropTypes.string)
    })
};

export default UploadBlock;
