import React, { useState, useEffect } from 'react';
import bulbImg from '../assets/bulb.png';
import Sparkles from './Sparkles';

// ... (TypewriterText component remains for now, will remove animation later)

const Hero = () => {
  return (
    <section className="hero">
      <div className="bulb-container">
        <Sparkles />
        {/* Base Image */}
        <img
          src={bulbImg}
          alt="Glowing lightbulb representing electricity"
          className="bulb-image"
        />
      </div>
      <h1 className="hero-title">
        Electricity Theft<br />
        Detection System
      </h1>
      <p className="hero-subtitle">
        <span className="tech-subtitle">
          Powered by Advanced Machine Learning Algorithm
        </span>
      </p>

      <button
        onClick={() => {
          document.getElementById('upload-section')?.scrollIntoView({ behavior: 'smooth' });
        }}
        style={{
          marginTop: '2rem',
          padding: '1rem 3rem',
          fontSize: '1.2rem',
          fontWeight: 'bold',
          background: 'linear-gradient(to right, #ffffff 20%, #3b82f6 50%, #ffffff 80%)',
          backgroundSize: '200% auto',
          border: 'none',
          borderRadius: '9999px',
          color: '#1e293b',
          cursor: 'pointer',
          boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)',
          transition: 'transform 0.2s, box-shadow 0.2s',
          animation: 'text-shine 4s linear infinite',
          zIndex: 10
        }}
        onMouseEnter={e => {
          e.target.style.transform = 'translateY(-2px)';
          e.target.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.6)';
        }}
        onMouseLeave={e => {
          e.target.style.transform = 'translateY(0)';
          e.target.style.boxShadow = '0 4px 15px rgba(59, 130, 246, 0.4)';
        }}
      >
        TRY IT
      </button>
    </section>
  );
};

export default Hero;
