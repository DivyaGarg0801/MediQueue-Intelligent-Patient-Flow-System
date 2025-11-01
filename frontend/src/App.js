import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import PatientDashboard from "./pages/PatientDashboard/patientDashBoard";
import DoctorDashboard from "./pages/DoctorDashboard/doctorDashboard";
import RegistrationDesk from "./pages/RegistrationDesk/registrationDesk";
import Home from "./pages/Home"; 
import Login from "./pages/login";
import Register from "./pages/register";


function App() {
  return (
    <Router>
      <Routes>
        
        <Route path="/" element={<Home />} />

        {/* Dashboards */}
        <Route path="/login" element={<Login />} />
        <Route path="/patients" element={<PatientDashboard />} />
        <Route path="/doctors" element={<DoctorDashboard />} />
        <Route path="/desk" element={<RegistrationDesk />} />
        <Route path="/register" element={<Register />} />
        <Route path="/patients" element={<PatientDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
