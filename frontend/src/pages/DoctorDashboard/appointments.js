import React, { useEffect, useState } from "react";

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loadingIds, setLoadingIds] = useState([]); // ids currently being updated
  const [error, setError] = useState(null);

  const fetchAppointments = async () => {
    try {
      setError(null);
      const res = await fetch("http://127.0.0.1:5000/appointments");
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || "Failed to fetch appointments");
      }
      const data = await res.json();
      setAppointments(data);
    } catch (err) {
      console.error("Error fetching appointments:", err);
      setError(err.message || "Error fetching appointments");
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const markAsCompleted = async (id) => {
    // prevent double-click
    if (loadingIds.includes(id)) return;
    setLoadingIds((s) => [...s, id]);

    try {
      const res = await fetch(`http://127.0.0.1:5000/appointments/${id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const payload = await res.json().catch(() => ({}));

      if (res.ok) {
        alert(payload.message || "Appointment marked as completed");
        await fetchAppointments();
      } else {
        alert(payload.error || payload.message || "Failed to mark completed");
      }
    } catch (err) {
      console.error("Error marking appointment completed:", err);
      alert("Network error while marking appointment completed");
    } finally {
      setLoadingIds((s) => s.filter((x) => x !== id));
    }
  };

  return (
    <div>
      <h1>Appointments</h1>
      {error && <div style={{ color: "red" }}>{error}</div>}
      <table border="1" cellPadding="10" style={{ borderCollapse: "collapse", width: "100%" }}>
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
                  {a.status && a.status.toLowerCase() === "completed" ? (
                    <button disabled style={{ backgroundColor: "#ccc" }}>
                      Completed
                    </button>
                  ) : (
                    <button
                      onClick={() => markAsCompleted(a.id)}
                      disabled={loadingIds.includes(a.id)}
                    >
                      {loadingIds.includes(a.id) ? "Processing..." : "Mark as Completed"}
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
