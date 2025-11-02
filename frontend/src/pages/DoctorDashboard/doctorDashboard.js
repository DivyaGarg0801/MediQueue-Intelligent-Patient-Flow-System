import React, { useState } from "react";
import "./doctorDashboard.css";
import Appointments from "./appointments";
import Consultations from "./consultations";
import Patients from "./patient";

const DoctorDashboard = () => {
  const [activeTab, setActiveTab] = useState("appointments");

  const handleLogout = () => {
    alert("Logged out successfully!");
    window.location.href = "/"; // or navigate("/login") if using React Router
  };

  return (
    <div className="doctor-dashboard">
      <aside className="sidebar">
        <h2>Doctor Dashboard</h2>
        <ul>
          <li onClick={() => setActiveTab("appointments")}>Appointments</li>
          <li onClick={() => setActiveTab("consultations")}>Consultations</li>
          <li onClick={() => setActiveTab("patients")}>Patients</li>
          <li onClick={handleLogout}>Logout</li>
        </ul>
      </aside>

      <main className="content">
        {activeTab === "appointments" && <Appointments />}
        {activeTab === "consultations" && <Consultations />}
        {activeTab === "patients" && <Patients />}
      </main>
    </div>
  );
};

export default DoctorDashboard;
