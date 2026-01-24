import React, { useState, useEffect } from 'react';
import '../App.css';

const CustomCursor = () => {
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [sparks, setSparks] = useState([]);

    // Track mouse position
    useEffect(() => {
        const handleMouseMove = (e) => {
            setPosition({ x: e.clientX, y: e.clientY });
        };

        const handleClick = (e) => {
            const id = Date.now();
            setSparks(prev => [...prev, { id, x: e.clientX, y: e.clientY }]);

            // Remove spark after animation
            setTimeout(() => {
                setSparks(prev => prev.filter(s => s.id !== id));
            }, 500);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('click', handleClick);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('click', handleClick);
        };
    }, []);

    return (
        <>
            <div
                className="custom-cursor"
                style={{ left: `${position.x}px`, top: `${position.y}px` }}
            >
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="cursor-icon">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="#3b82f6" stroke="#60a5fa" />
                </svg>
            </div>
            {sparks.map(spark => (
                <div
                    key={spark.id}
                    className="click-spark"
                    style={{ left: `${spark.x}px`, top: `${spark.y}px` }}
                />
            ))}
        </>
    );
};

export default CustomCursor;
