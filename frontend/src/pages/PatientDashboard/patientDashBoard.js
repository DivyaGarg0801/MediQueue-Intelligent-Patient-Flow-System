import React, { useEffect, useState } from "react";
import { User, LogOut } from "lucide-react";
import "./patientDashboard.css";

const PatientDashboard = () => {
  const [patient, setPatient] = useState({});
  const [appointments, setAppointments] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [showProfile, setShowProfile] = useState(false);

  const patientId = localStorage.getItem("patientId");

  // Fetch patient info
  useEffect(() => {
    if (!patientId) return;
    fetch(`http://localhost:5000/patients/${patientId}`)
      .then((res) => res.json())
      .then((data) => setPatient(data))
      .catch((err) => console.log(err));
  }, [patientId]);

  // Fetch appointments
  useEffect(() => {
    fetch(`http://localhost:5000/appointments`)
      .then((res) => res.json())
      .then((data) => {
        const myAppointments = data.filter(
          (appt) => appt.p_id === parseInt(patientId)
        );
        setAppointments(myAppointments);
      })
      .catch((err) => console.log(err));
  }, [patientId]);

  // Fetch consultations
  useEffect(() => {
    fetch(`http://localhost:5000/consultations`)
      .then((res) => res.json())
      .then((data) => {
        const myConsultations = data.filter((c) =>
          appointments.find((a) => a.a_id === c.a_id)
        );
        setConsultations(myConsultations);
      })
      .catch((err) => console.log(err));
  }, [appointments]);

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Welcome, {patient.p_name || "Patient"}!</h1>

        <div className="header-right">
          <button
            className="profile-button"
            onClick={() => setShowProfile(!showProfile)}
          >
            <User />
          </button>
          <button
            className="logout-button"
            onClick={() => {
              localStorage.removeItem("patientId");
              window.location.href = "/login";
            }}
          >
            <LogOut /> Logout
          </button>
        </div>
      </header>

      {showProfile && (
        <div className="profile-modal">
          <div className="profile-content">
            <h2>My Profile</h2>
            <p><strong>Name:</strong> {patient.p_name}</p>
            <p><strong>Age:</strong> {patient.age}</p>
            <p><strong>Gender:</strong> {patient.gender}</p>
            <p><strong>Mobile:</strong> {patient.contact}</p>
            <p><strong>Address:</strong> {patient.address}</p>
            <button onClick={() => setShowProfile(false)}>Close</button>
          </div>
        </div>
      )}

      <div className="summary-cards">
        <div className="card">
          <h3>Upcoming Appointments</h3>
          <p>{appointments.filter(a => new Date(a.date) >= new Date()).length}</p>
        </div>
        <div className="card">
          <h3>Past Appointments</h3>
          <p>{appointments.filter(a => new Date(a.date) < new Date()).length}</p>
        </div>
        <div className="card">
          <h3>Health Records</h3>
          <p>{consultations.length}</p>
        </div>
      </div>

      {/* Appointments Table */}
      <div className="appointments-section">
        <h2>Upcoming Appointments</h2>
        <table>
          <thead>
            <tr>
              <th>Doctor</th>
              <th>Date</th>
              <th>Time</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {appointments
              .filter((a) => new Date(a.date) >= new Date())
              .map((a) => (
                <tr key={a.a_id}>
                  <td>{a.d_id}</td>
                  <td>{a.date}</td>
                  <td>{a.time}</td>
                  <td>{a.a_status}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Health Records Table */}
      <div className="records-section">
        <h2>Health Records</h2>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Doctor</th>
              <th>Symptoms</th>
              <th>Prescription</th>
            </tr>
          </thead>
          <tbody>
            {consultations.map((c) => (
              <tr key={c.c_id}>
                <td>{new Date(c.date).toLocaleDateString()}</td>
                <td>{appointments.find((a) => a.a_id === c.a_id)?.d_id}</td>
                <td>{c.symptoms}</td>
                <td>{c.prescription}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PatientDashboard;
