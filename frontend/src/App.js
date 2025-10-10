import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import Patients from './components/Patients';
import Doctors from './components/Doctors';
import Appointments from './components/Appointments';
import Consultations from './components/Consultations';
import Billing from './components/Billing';
import Queue from './components/Queue';

function App() {
  return (
    <Router>
      <div className="App">
        <nav className="navbar">
          <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h1>Medique Hospital Management</h1>
              <div style={{ textAlign: 'center', flex: 1 }}>
                <span style={{ fontSize: '14px', opacity: 0.8 }}>Developed by Team SheTech</span>
              </div>
              <ul className="navbar-nav">
                <li><Link to="/">Dashboard</Link></li>
                <li><Link to="/patients">Patients</Link></li>
                <li><Link to="/doctors">Doctors</Link></li>
                <li><Link to="/appointments">Appointments</Link></li>
                <li><Link to="/consultations">Consultations</Link></li>
                <li><Link to="/billing">Billing</Link></li>
                <li><Link to="/queue">Queue</Link></li>
              </ul>
            </div>
          </div>
        </nav>

        <div className="container">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/patients" element={<Patients />} />
            <Route path="/doctors" element={<Doctors />} />
            <Route path="/appointments" element={<Appointments />} />
            <Route path="/consultations" element={<Consultations />} />
            <Route path="/billing" element={<Billing />} />
            <Route path="/queue" element={<Queue />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
