import React, { useEffect, useState } from "react";

const Appointments = ({ onAddConsultation }) => {
  const [appointments, setAppointments] = useState([]);
  const [loadingIds, setLoadingIds] = useState([]); // ids currently being updated
  const [error, setError] = useState(null);
  const [consultations, setConsultations] = useState([]);

  const fetchAppointments = async () => {
    try {
      setError(null);
      const res = await fetch("http://127.0.0.1:5050/appointments");
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

  // Fetch consultations to check which appointments already have consultations
  const fetchConsultations = async () => {
    try {
      const res = await fetch("http://127.0.0.1:5050/consultations");
      if (res.ok) {
        const data = await res.json();
        setConsultations(data);
      }
    } catch (err) {
      console.error("Error fetching consultations:", err);
    }
  };

  useEffect(() => {
    fetchAppointments();
    fetchConsultations();
  }, []);

  const checkHasConsultation = (appointmentId) => {
    return consultations.some((c) => c.a_id === appointmentId);
  };

  const deleteAppointment = async (id) => {
    if (!window.confirm("Are you sure you want to delete this appointment? This action cannot be undone.")) {
      return;
    }

    // prevent double-click
    if (loadingIds.includes(id)) return;
    setLoadingIds((s) => [...s, id]);

    try {
      const res = await fetch(`http://127.0.0.1:5050/appointments/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      const payload = await res.json().catch(() => ({}));

      if (res.ok) {
        alert(payload.message || "Appointment deleted successfully");
        await fetchAppointments();
        await fetchConsultations(); // Refresh consultations list
      } else {
        alert(payload.error || payload.message || "Failed to delete appointment");
      }
    } catch (err) {
      console.error("Error deleting appointment:", err);
      alert("Network error while deleting appointment");
    } finally {
      setLoadingIds((s) => s.filter((x) => x !== id));
    }
  };

  const markAsCompleted = async (id) => {
    // prevent double-click
    if (loadingIds.includes(id)) return;
    setLoadingIds((s) => [...s, id]);

    try {
      const res = await fetch(`http://127.0.0.1:5050/appointments/${id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const payload = await res.json().catch(() => ({}));

      if (res.ok) {
        alert(payload.message || "Appointment marked as completed");
        await fetchAppointments();
        await fetchConsultations(); // Refresh consultations list
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
            <th>Token #</th>
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
                <td style={{ textAlign: "center", fontWeight: "bold" }}>{a.token_no || "--"}</td>
                <td>{a.patient}</td>
                <td>{a.doctor}</td>
                <td>{a.date}</td>
                <td>{a.time}</td>
                <td>{a.status}</td>
                <td>
                  <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                    {a.status && a.status.toLowerCase() === "completed" ? (
                      <>
                        {checkHasConsultation(a.id) ? (
                          <span style={{ color: "#28a745", fontWeight: "bold" }}>
                            Consultation Added
                          </span>
                        ) : (
                          <button
                            onClick={() => onAddConsultation && onAddConsultation(a.id)}
                            style={{
                              backgroundColor: "#0077b6",
                              color: "white",
                              border: "none",
                              padding: "6px 12px",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontSize: "13px",
                            }}
                          >
                            Add Consultation
                          </button>
                        )}
                      </>
                    ) : (
                      <button
                        onClick={() => markAsCompleted(a.id)}
                        disabled={loadingIds.includes(a.id)}
                        style={{
                          backgroundColor: loadingIds.includes(a.id) ? "#ccc" : "#28a745",
                          color: "white",
                          border: "none",
                          padding: "6px 12px",
                          borderRadius: "4px",
                          cursor: loadingIds.includes(a.id) ? "not-allowed" : "pointer",
                          fontSize: "13px",
                        }}
                      >
                        {loadingIds.includes(a.id) ? "Processing..." : "Mark as Completed"}
                      </button>
                    )}
                    <button
                      onClick={() => deleteAppointment(a.id)}
                      disabled={loadingIds.includes(a.id)}
                      style={{
                        backgroundColor: "#dc3545",
                        color: "white",
                        border: "none",
                        padding: "6px 12px",
                        borderRadius: "4px",
                        cursor: loadingIds.includes(a.id) ? "not-allowed" : "pointer",
                        fontSize: "13px",
                      }}
                    >
                      Delete
                    </button>
                  </div>
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
