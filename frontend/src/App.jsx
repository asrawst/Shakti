import React from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import UploadBlock from './components/UploadBlock';
import FetchButton from './components/FetchButton';
import ResultsDisplay from './components/ResultsDisplay';

import LoginModal from './components/LoginModal';
import AboutUsModal from './components/AboutUsModal';
import HistoryModal from './components/HistoryModal';
import { auth, db, storage } from './firebaseConfig';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, addDoc, serverTimestamp, doc, setDoc } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
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
  const [user, setUser] = React.useState(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = React.useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = React.useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = React.useState(false);
  const resultsRef = React.useRef(null);

  //   React.useEffect(() => {
  //     const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
  //       setUser(currentUser);
  //     });
  //     return () => unsubscribe();
  //   }, []);

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

        // Save to history if user is logged in
        if (user) {
          // Simulate saving to history for dummy user
          console.log("Mocking save to history for user:", user.email);
          // In a real app with dummy auth, we might skip this or save to localStorage
          // For now, we just log it as success so the UI behaves correctly

          /* 
          // Real Firebase Code (Commented out for Dummy Auth)
          try {
            const storageRef = ref(storage, `history/${user.uid}/${Date.now()}_${sourceFile.name}.json`);
            await uploadString(storageRef, JSON.stringify(resultData), 'raw');
            // ...
          } catch (err) { ... }
          */
        }
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

  const handleLogoutClick = async () => {
    // try {
    //   await signOut(auth);
    // } catch (error) {
    //   console.error("Error signing out: ", error);
    // }
    setUser(null);
  };

  return (
    <div className="container" style={{ maxWidth: '100%', padding: 0 }}>
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
    </div>
  );
}

export default App;
