import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import ChatRoom from './ChatRoom';

function App() {
  return (
    <Router>
      <div className="App font-sans antialiased bg-beige-100 text-brown-900 min-h-screen">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/chat" element={<ChatRoom />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;