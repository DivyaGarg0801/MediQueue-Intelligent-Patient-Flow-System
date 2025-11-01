import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import PatientDashboard from "./pages/PatientDashboard/patientDashBoard";
import DoctorDashboard from "./pages/DoctorDashboard/doctorDashboard";
import RegistrationDesk from "./pages/RegistrationDesk/registrationDesk";

function App() {
  return (
    <Router>
      <nav>
        <Link to="/patients">Patients</Link> |{" "}
        <Link to="/doctors">Doctors</Link> |{" "}
        <Link to="/desk">Registration Desk</Link>
      </nav>
      <Routes>
        <Route path="/patients" element={<PatientDashboard />} />
        <Route path="/doctors" element={<DoctorDashboard />} />
        <Route path="/desk" element={<RegistrationDesk />} />
      </Routes>
    </Router>
  );
}

export default App;
