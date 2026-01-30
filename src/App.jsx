import React from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import UploadBlock from './components/UploadBlock';
import FetchButton from './components/FetchButton';
import ResultsDisplay from './components/ResultsDisplay';
import './App.css';

const dataset = {
  id: 'source',
  title: 'Upload Source Dataset',
  description: 'File format: .csv',
  icon: 'meter',
  details: {
    text: 'Upload the complete dataset containing consumer consumption, transformer mapping, and other required signals.',
    columns: ['consumer_id', 'energy_consumed', 'transformer_id']
  }
};

function App() {
  const [files, setFiles] = React.useState({});
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState(null);
  const resultsRef = React.useRef(null);

  React.useEffect(() => {
    if (result && resultsRef.current) {
      // Small delay to ensure render
      setTimeout(() => {
        resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [result]);

  const handleFileUpload = (id, file) => {
    setFiles(prev => ({
      ...prev,
      [id]: file
    }));
    setResult(null); // Clear previous results on new upload
  };

  const handleFetch = async () => {
    try {
      setLoading(true);
      setResult(null);
      const formData = new FormData();
      const sourceFile = files['source'];

      if (!sourceFile) {
        alert("Please upload the source dataset.");
        setLoading(false);
        return;
      }

      formData.append('files', sourceFile);

      const response = await fetch('http://localhost:8000/api/v1/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error: ${errorText}`);
      }

      const data = await response.json();
      console.log('Analysis Result:', data);

      if (data.status === 'success') {
        setResult(data.data);
      } else {
        setResult(data); // In case structure differs, though ml_engine returns {status, data}
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '100%', padding: 0 }}>
      <Navbar />
      <div className="container">
        <main className="main-content">
          <Hero />

          <section>
            <h2 className="section-title">Upload Datasets</h2>
            <div className="upload-grid">
              <UploadBlock
                key={dataset.id}
                title={dataset.title}
                description={dataset.description}
                icon={dataset.icon}
                details={dataset.details}
                onFileUpload={(file) => handleFileUpload(dataset.id, file)}
              />
            </div>

            <FetchButton onClick={handleFetch} disabled={loading} />

            <div ref={resultsRef}>
              <ResultsDisplay data={result} />
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default App;
