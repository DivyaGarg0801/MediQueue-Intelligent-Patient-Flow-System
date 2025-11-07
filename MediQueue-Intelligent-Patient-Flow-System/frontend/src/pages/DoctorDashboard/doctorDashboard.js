import React, { useState } from "react";
import "./doctorDashboard.css";
import Appointments from "./appointments";
import Consultations from "./consultations";
import Patients from "./patient";

const DoctorDashboard = () => {
  const [activeTab, setActiveTab] = useState("appointments");
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);

  const handleLogout = () => {
    alert("Logged out successfully!");
    window.location.href = "/"; // or navigate("/login") if using React Router
  };

  const handleAddConsultation = (appointmentId) => {
    setSelectedAppointmentId(appointmentId);
    setActiveTab("consultations");
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    // Clear selected appointment when switching tabs manually
    if (tab !== "consultations") {
      setSelectedAppointmentId(null);
    }
  };

  return (
    <div className="doctor-dashboard">
      <aside className="sidebar">
        <h2>Doctor Dashboard</h2>
        <ul>
          <li 
            className={activeTab === "appointments" ? "active" : ""}
            onClick={() => handleTabChange("appointments")}
          >
            Appointments
          </li>
          <li 
            className={activeTab === "consultations" ? "active" : ""}
            onClick={() => handleTabChange("consultations")}
          >
            Consultations
          </li>
          <li 
            className={activeTab === "patients" ? "active" : ""}
            onClick={() => handleTabChange("patients")}
          >
            Patients
          </li>
          <li onClick={handleLogout}>Logout</li>
        </ul>
      </aside>

      <main className="content">
        {activeTab === "appointments" && (
          <Appointments onAddConsultation={handleAddConsultation} />
        )}
        {activeTab === "consultations" && (
          <Consultations selectedAppointmentId={selectedAppointmentId} />
        )}
        {activeTab === "patients" && <Patients />}
      </main>
    </div>
  );
};

export default DoctorDashboard;
