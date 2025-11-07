// src/components/MyAppointments.js
import React, { useEffect, useState } from "react";
import "./myAppointments.css";

const MyAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const patientId = localStorage.getItem("patientId");

  useEffect(() => {
    fetch("http://localhost:5050/appointments")
      .then((res) => res.json())
      .then((data) => {
        const myAppointments = data.filter(
          (appt) => appt.p_id === parseInt(patientId)
        );
        setAppointments(myAppointments);
      })
      .catch((err) => console.error(err));
  }, [patientId]);

  const handleCancel = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this appointment?")) return;

    try {
      const response = await fetch(`http://localhost:5050/appointments/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        alert("Appointment cancelled.");
        setAppointments(appointments.filter((a) => a.a_id !== id));
      } else {
        alert("Error cancelling appointment.");
      }
    } catch (err) {
      console.error(err);
      alert("Server error. Try again later.");
    }
  };

  return (
    <div className="my-appointments-container">
      <h2>My Appointments</h2>
      <table>
        <thead>
          <tr>
            <th>Doctor</th>
            <th>Date</th>
            <th>Time</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {appointments.length > 0 ? (
            appointments.map((a) => (
              <tr key={a.a_id}>
                <td>{a.d_id}</td>
                <td>{a.date}</td>
                <td>{a.time}</td>
                <td>{a.a_status}</td>
                <td>
                  {a.a_status !== "Completed" ? (
                    <button onClick={() => handleCancel(a.a_id)}>Cancel</button>
                  ) : (
                    <span>-</span>
                  )}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5">No appointments found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default MyAppointments;
