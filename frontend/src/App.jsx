import React from 'react';
import Navbar from './components/layout/Navbar';
import Hero from './components/layout/Hero';
import Footer from './components/layout/Footer';
import UploadBlock from './components/features/UploadBlock';
import ResultsDisplay from './components/features/ResultsDisplay';
import FetchButton from './components/common/FetchButton';
import LoginModal from './components/modals/LoginModal';
import AboutUsModal from './components/modals/AboutUsModal';
import HistoryModal from './components/modals/HistoryModal';
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

/**
 * Main application component that orchestrates the layout, modals,
 * and data fetching logic for the Electricity Theft Detection System.
 *
 * @returns {React.ReactElement} The rendered App component.
 */
function App() {
  const [files, setFiles] = React.useState({});
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState(null);
  const [user, setUser] = React.useState(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = React.useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = React.useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = React.useState(false);
  const resultsRef = React.useRef(null);

  // Removed unused Firebase authentication listener

  React.useEffect(() => {
    if (result && resultsRef.current) {
      // Small delay to ensure render
      setTimeout(() => {
        resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [result]);

  /**
   * Handles file uploads from the UploadBlock.
   *
   * @param {string} id - The identifier for the upload block (e.g., 'source').
   * @param {File} file - The uploaded file object.
   */
  const handleFileUpload = (id, file) => {
    setFiles(prev => ({
      ...prev,
      [id]: file
    }));
    setResult(null); // Clear previous results on new upload
  };

  /**
   * Sends the uploaded files to the backend for analysis.
   */
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

      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API_BASE_URL}/api/v1/analyze`, {
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
        const resultData = data.data;
        setResult(resultData);
        setLoading(false); // Update UI immediately, don't wait for history save

        // Save to history logic would go here in a fully authorized environment.
      } else {
        setResult(data);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginClick = () => {
    setIsLoginModalOpen(true);
  };

  /**
   * Logs out the current user.
   */
  const handleLogoutClick = async () => {
    setUser(null);
  };


  return (
    <div className="container" style={{ maxWidth: '100%', padding: 0, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        user={user}
        onLoginClick={handleLoginClick}
        onLogoutClick={handleLogoutClick}
        onAboutClick={() => setIsAboutModalOpen(true)}
        onHistoryClick={() => setIsHistoryModalOpen(true)}
      />
      {isHistoryModalOpen && (
        <HistoryModal
          user={user}
          onClose={() => setIsHistoryModalOpen(false)}
          onLoadHistory={(historyData) => setResult(historyData)}
        />
      )}
      {isAboutModalOpen && (
        <AboutUsModal onClose={() => setIsAboutModalOpen(false)} />
      )}
      {isLoginModalOpen && (
        <LoginModal
          onClose={() => setIsLoginModalOpen(false)}
          onLoginSuccess={(mockUser) => {
            setUser(mockUser);
            setIsLoginModalOpen(false);
          }}
        />
      )}
      <div className="container">
        <main className="main-content">
          <Hero />

          <section>
            <h2 id="upload-section" className="section-title">Upload Dataset</h2>
            <div className="upload-grid">
              <UploadBlock
                key={dataset.id}
                title={dataset.title}
                description={dataset.description}
                icon={dataset.icon}
                details={dataset.details}
                onFileUpload={(file) => handleFileUpload(dataset.id, file)}
                sampleData={{
                  url: '/sample_data/sample_dataset.csv',
                  name: 'Sample_Dataset.csv'
                }}
              />
            </div>

            <FetchButton onClick={handleFetch} disabled={loading} isAnalyzed={!!result} />

            <div ref={resultsRef}>
              <ResultsDisplay data={result} />
            </div>
          </section>
        </main>
      </div>
      <Footer onAboutClick={() => setIsAboutModalOpen(true)} />
    </div>
  );
}

export default App;
