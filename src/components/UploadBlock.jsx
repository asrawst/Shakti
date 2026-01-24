import React from 'react';
import { Upload } from 'lucide-react';
import PropTypes from 'prop-types';

const UploadBlock = ({ label, description }) => {
    return (
        <div className="upload-card">
            <Upload className="upload-icon" />
            <h3 className="upload-label">{label}</h3>
            <p className="upload-desc">{description}</p>
            {/* 
        In a real app, we would have an <input type="file" /> here.
        For now, it's a visual block as requested.
      */}
        </div>
    );
};

UploadBlock.propTypes = {
    label: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
};

export default UploadBlock;
