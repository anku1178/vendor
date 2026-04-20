import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import AddPurchase from './pages/AddPurchase';
import ViewRecords from './pages/ViewRecords';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/add" element={<AddPurchase />} />
            <Route path="/records" element={<ViewRecords />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
