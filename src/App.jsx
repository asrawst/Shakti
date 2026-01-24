import React from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import UploadBlock from './components/UploadBlock';
import FetchButton from './components/FetchButton';
import CustomCursor from './components/CustomCursor';
import './App.css';

const datasets = [
  { label: 'Smart Meter Data', description: 'Upload consumer consumption logs (CSV/JSON)' },
  { label: 'Grid Topology', description: 'Network mapping and transformer data' },
  { label: 'Historical Records', description: 'Past theft incidents and pattern data' },
  { label: 'Environmental Factors', description: 'Weather and seasonal adjustment data' }
];

function App() {
  return (
    <div className="container" style={{ maxWidth: '100%', padding: 0 }}>
      {/* Custom Cursor Component */}
      <CustomCursor />

      <Navbar />
      <div className="container">
        <main className="main-content">
          <Hero />

          <section>
            <div className="upload-grid">
              {datasets.map((data, index) => (
                <UploadBlock
                  key={index}
                  label={data.label}
                  description={data.description}
                />
              ))}
            </div>

            <FetchButton />
          </section>
        </main>
      </div>
    </div>
  );
}

export default App;
