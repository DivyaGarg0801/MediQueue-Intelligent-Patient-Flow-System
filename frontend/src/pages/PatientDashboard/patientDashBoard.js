import React, { useEffect, useState } from "react";
import "./patientDashboard.css";
import { useNavigate } from "react-router-dom"; // ✅ Added

const PatientDashboard = () => {
  const [patientData, setPatientData] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [past, setPast] = useState([]);

  const userId = localStorage.getItem("userId");
  const role = localStorage.getItem("role");
  const navigate = useNavigate(); // ✅ Added

  // ✅ Fetch patient details
  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        const res = await fetch(`http://localhost:5000/patients/${userId}`);
        const data = await res.json();
        setPatientData(data);
      } catch (err) {
        console.error("Error fetching patient data:", err);
      }
    };
    fetchPatientData();
  }, [userId]);

  // ✅ Fetch and filter appointments
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const res = await fetch("http://localhost:5000/appointments");
        const data = await res.json();

        if (patientData && patientData.p_name) {
          const patientAppointments = data.filter(
            (a) => a.patient.toLowerCase() === patientData.p_name.toLowerCase()
          );

          const today = new Date().toISOString().split("T")[0];

          const upcomingList = patientAppointments.filter(
            (a) =>
              (a.status === "Scheduled" || a.date >= today)
          );

          const pastList = patientAppointments.filter(
            (a) =>
              (a.status === "Completed" || a.date < today)
          );

          setAppointments(patientAppointments);
          setUpcoming(upcomingList);
          setPast(pastList);
        }
      } catch (err) {
        console.error("Error fetching appointments:", err);
      }
    };
    fetchAppointments();
  }, [patientData]);

  if (!patientData) return <div className="loading">Loading Dashboard...</div>;

  return (
    <div className="patient-dashboard">
      <div className="dashboard-header">
        <h2>Welcome, {patientData.p_name}</h2>
        {/* ✅ Added Book Appointment button */}
        <button
          className="book-btn"
          onClick={() => navigate("/bookappointment")}
        >
          + Book Appointment
        </button>
      </div>

      <div className="stats-section">
        <div className="stat-card">
          <h3>{upcoming.length}</h3>
          <p>Upcoming Appointments</p>
        </div>
        <div className="stat-card">
          <h3>{past.length}</h3>
          <p>Past Appointments</p>
        </div>
      </div>

      <div className="appointments-section">
        <h3>Upcoming Appointments</h3>
        {upcoming.length > 0 ? (
          <div className="appointment-list">
            {upcoming.map((a) => (
              <div key={a.id} className="appointment-card upcoming">
                <p><strong>Doctor:</strong> {a.doctor}</p>
                <p><strong>Date:</strong> {a.date}</p>
                <p><strong>Time:</strong> {a.time}</p>
                <p className="status">{a.status}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="empty-msg">No upcoming appointments</p>
        )}

        <h3>Past Appointments</h3>
        {past.length > 0 ? (
          <div className="appointment-list">
            {past.map((a) => (
              <div key={a.id} className="appointment-card past">
                <p><strong>Doctor:</strong> {a.doctor}</p>
                <p><strong>Date:</strong> {a.date}</p>
                <p><strong>Time:</strong> {a.time}</p>
                <p className="status">{a.status}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="empty-msg">No past appointments</p>
        )}
      </div>
    </div>
  );
};

export default PatientDashboard;
