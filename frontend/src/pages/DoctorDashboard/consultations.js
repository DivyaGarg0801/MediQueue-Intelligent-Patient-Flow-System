import React, { useEffect, useState } from "react";

const Consultations = () => {
  const [consultations, setConsultations] = useState([]);

  // Fetch all consultations
  const fetchConsultations = async () => {
    try {
      const res = await fetch("http://127.0.0.1:5000/consultations");
      const data = await res.json();
      setConsultations(data);
    } catch (err) {
      console.error("❌ Error fetching consultations:", err);
    }
  };

  useEffect(() => {
    fetchConsultations();
  }, []);

  // ✅ Function to mark consultation as completed
  const markCompleted = async (c_id) => {
    try {
      const res = await fetch(`http://127.0.0.1:5000/consultations/${c_id}/complete`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();

      if (res.ok) {
        alert(data.message || "Marked as completed!");
        // Refresh table
        fetchConsultations();
      } else {
        alert(data.error || "Failed to mark as completed");
      }
    } catch (err) {
      console.error("❌ Error marking complete:", err);
      alert("Something went wrong while updating.");
    }
  };

  return (
    <div>
      <h1>Consultations</h1>
      <table border="1" cellPadding="8" style={{ width: "100%", textAlign: "left" }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Patient</th>
            <th>Doctor</th>
            <th>Date</th>
            <th>Symptoms</th>
            <th>Prescription</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {consultations.length > 0 ? (
            consultations.map((c) => (
              <tr key={c.id}>
                <td>{c.id}</td>
                <td>{c.patient}</td>
                <td>{c.doctor}</td>
                <td>{c.date}</td>
                <td>{c.symptoms}</td>
                <td>{c.prescription}</td>
                <td>{c.status}</td>
                <td>
                  {c.status !== "Completed" ? (
                    <button onClick={() => markCompleted(c.id)}>Mark Completed</button>
                  ) : (
                    <span>✅ Completed</span>
                  )}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="8">No consultations found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Consultations;
