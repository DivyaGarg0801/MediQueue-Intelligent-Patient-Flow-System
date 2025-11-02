import React, { useEffect, useState } from "react";

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);

  // Fetch all appointments
  const fetchAppointments = () => {
    fetch("http://127.0.0.1:5000/appointments")
      .then((res) => res.json())
      .then((data) => setAppointments(data))
      .catch((err) => console.error("Error fetching appointments:", err));
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  // Function to mark appointment as completed
  const markAsCompleted = async (id) => {
    try {
      const response = await fetch(`http://127.0.0.1:5000/appointments/${id}/complete`, {
        method: "POST",
      });

      if (response.ok) {
        alert("Appointment marked as completed!");
        fetchAppointments(); // refresh the table
      } else {
        alert("Failed to update appointment status.");
      }
    } catch (err) {
      console.error("Error marking appointment completed:", err);
    }
  };

  return (
    <div>
      <h1>Appointments</h1>
      <table border="1" cellPadding="10" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Patient</th>
            <th>Doctor</th>
            <th>Date</th>
            <th>Time</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {appointments.length > 0 ? (
            appointments.map((a) => (
              <tr key={a.id}>
                <td>{a.id}</td>
                <td>{a.patient}</td>
                <td>{a.doctor}</td>
                <td>{a.date}</td>
                <td>{a.time}</td>
                <td>{a.status}</td>
                <td>
                  {a.status !== "Completed" ? (
                    <button onClick={() => markAsCompleted(a.id)}>
                      Mark as Completed
                    </button>
                  ) : (
                    <button disabled style={{ backgroundColor: "#ccc" }}>
                      Completed
                    </button>
                  )}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="7">No appointments found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Appointments;
