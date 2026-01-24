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
    </section>
  );
};

export default Hero;
