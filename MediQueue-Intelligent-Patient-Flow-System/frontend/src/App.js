import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import PatientDashboard from "./pages/PatientDashboard/patientDashBoard";
import DoctorDashboard from "./pages/DoctorDashboard/doctorDashboard";
import BookAppointment from "./pages/PatientDashboard/bookappointment";
import RegistrationDesk from "./pages/RegistrationDesk/registrationDesk";
import AdminDashboard from "./pages/AdminDashboard/adminDashboard";
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
        <Route path="/bookappointment" element={<BookAppointment />} />
        <Route path="/desk" element={<RegistrationDesk />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </Router>
  );
}

export default App;
