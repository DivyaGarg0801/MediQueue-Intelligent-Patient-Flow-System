import React, { useEffect, useState } from "react";
import "./doctorDashboard.css";

const DoctorDashboard = () => {
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    fetch("http://127.0.0.1:5000/api/appointments")
      .then((res) => res.json())
      .then((data) => setAppointments(data))
      .catch((err) => console.error("Error fetching appointments:", err));
  }, []);

  return (
    <div className="doctor-dashboard">
      <aside className="sidebar">
        <h2>Dr. Dashboard</h2>
        <ul>
          <li>Appointments</li>
          <li>Consultations</li>
          <li>Patients</li>
          <li>Logout</li>
        </ul>
      </aside>

      <main className="content">
        <h1>Today's Appointments</h1>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Patient</th>
              <th>Doctor</th>
              <th>Date</th>
              <th>Time</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {appointments.length > 0 ? (
              appointments.map((a) => (
                <tr key={a.a_id}>
                  <td>{a.a_id}</td>
                  <td>{a.patient}</td>
                  <td>{a.doctor}</td>
                  <td>{a.date}</td>
                  <td>{a.time}</td>
                  <td>{a.status}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6">Loading appointments...</td>
              </tr>
            )}
          </tbody>
        </table>
      </main>
    </div>
  );
};

export default DoctorDashboard;
