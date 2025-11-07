import React, { useEffect, useState } from "react";

const Consultations = ({ selectedAppointmentId }) => {
  const [consultations, setConsultations] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    a_id: "",
    symptoms: "",
    prescription: "",
  });
  const [loading, setLoading] = useState(false);
  const [deletingIds, setDeletingIds] = useState([]);
  const doctorId = localStorage.getItem("userId");

  // Fetch all consultations
  const fetchConsultations = async () => {
    try {
      const res = await fetch("http://127.0.0.1:5050/consultations");
      const data = await res.json();
      setConsultations(data);
    } catch (err) {
      console.error("❌ Error fetching consultations:", err);
    }
  };

  // Fetch completed appointments for this doctor
  const fetchCompletedAppointments = async () => {
    if (!doctorId) return;
    try {
      const res = await fetch(`http://127.0.0.1:5050/doctor/${doctorId}/appointments`);
      if (res.ok) {
        const data = await res.json();
        // Filter only completed appointments that don't have consultations yet
        const completed = data.filter(
          (apt) => apt.a_status && apt.a_status.toLowerCase() === "completed"
        );
        
        // Get appointment IDs that already have consultations
        // We'll fetch consultations separately to avoid dependency issues
        const consultationRes = await fetch("http://127.0.0.1:5050/consultations");
        const consultationData = await consultationRes.json();
        const consultationAppointmentIds = consultationData.map((c) => c.a_id);
        
        // Filter out appointments that already have consultations
        let availableAppointments = completed.filter(
          (apt) => !consultationAppointmentIds.includes(apt.a_id)
        );
        
        // If a specific appointment is selected, ensure it's in the list
        if (selectedAppointmentId) {
          const selectedAppt = completed.find(apt => apt.a_id === parseInt(selectedAppointmentId));
          if (selectedAppt && !availableAppointments.find(apt => apt.a_id === selectedAppt.a_id)) {
            // Add the selected appointment even if it would normally be filtered
            availableAppointments = [selectedAppt, ...availableAppointments];
          }
        }
        
        setAppointments(availableAppointments);
      }
    } catch (err) {
      console.error("❌ Error fetching appointments:", err);
    }
  };

  useEffect(() => {
    fetchConsultations();
  }, []);

  useEffect(() => {
    if (doctorId) {
      fetchCompletedAppointments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctorId, selectedAppointmentId]);

  // Auto-open form and pre-select appointment if coming from appointments tab
  useEffect(() => {
    if (selectedAppointmentId) {
      // First ensure appointments are loaded
      const loadAndSelect = async () => {
        if (doctorId) {
          await fetchCompletedAppointments();
          // Wait a bit for appointments to load, then set the form
          setTimeout(() => {
            setShowForm(true);
            setFormData((prev) => ({ ...prev, a_id: selectedAppointmentId.toString() }));
          }, 100);
        }
      };
      loadAndSelect();
    }
  }, [selectedAppointmentId, doctorId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.a_id || !formData.symptoms || !formData.prescription) {
      alert("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:5050/consultations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          a_id: parseInt(formData.a_id),
          symptoms: formData.symptoms,
          prescription: formData.prescription,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert(data.message || "Consultation added successfully!");
        setFormData({ a_id: "", symptoms: "", prescription: "" });
        setShowForm(false);
        fetchConsultations(); // Refresh consultations list
        fetchCompletedAppointments(); // Refresh available appointments
      } else {
        alert(data.error || "Failed to add consultation");
      }
    } catch (err) {
      console.error("Error adding consultation:", err);
      alert("Error adding consultation. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const deleteConsultation = async (c_id) => {
    if (!window.confirm("Are you sure you want to delete this consultation? This action cannot be undone.")) {
      return;
    }

    // prevent double-click
    if (deletingIds.includes(c_id)) return;
    setDeletingIds((s) => [...s, c_id]);

    try {
      const res = await fetch(`http://127.0.0.1:5050/consultations/${c_id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      if (res.ok) {
        alert(data.message || "Consultation deleted successfully!");
        fetchConsultations(); // Refresh consultations list
        fetchCompletedAppointments(); // Refresh available appointments
      } else {
        alert(data.error || "Failed to delete consultation");
      }
    } catch (err) {
      console.error("Error deleting consultation:", err);
      alert("Error deleting consultation. Please try again.");
    } finally {
      setDeletingIds((s) => s.filter((x) => x !== c_id));
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h1>Consultations</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            padding: "10px 20px",
            backgroundColor: "#0077b6",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            fontSize: "16px",
          }}
        >
          {showForm ? "Cancel" : "+ Add Consultation"}
        </button>
      </div>

      {showForm && (
        <div
          style={{
            backgroundColor: "#f8f9fa",
            padding: "20px",
            borderRadius: "8px",
            marginBottom: "30px",
            border: "1px solid #dee2e6",
          }}
        >
          <h2 style={{ marginTop: 0, marginBottom: "20px" }}>Add New Consultation</h2>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                Select Appointment:
              </label>
              <select
                value={formData.a_id}
                onChange={(e) => setFormData({ ...formData, a_id: e.target.value })}
                required
                disabled={selectedAppointmentId && appointments.length === 0}
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "5px",
                  border: "1px solid #ccc",
                  fontSize: "14px",
                  backgroundColor: selectedAppointmentId && appointments.length === 0 ? "#f0f0f0" : "white",
                }}
              >
                {selectedAppointmentId && appointments.length === 0 ? (
                  <option value={selectedAppointmentId}>Loading appointment...</option>
                ) : (
                  <>
                    <option value="">-- Select a completed appointment --</option>
                    {appointments.length > 0 ? (
                      appointments.map((apt) => {
                        const patientName = apt.patient || apt.p_name || "Unknown Patient";
                        const appointmentDate = apt.date || "";
                        const appointmentTime = apt.time ? (typeof apt.time === 'string' ? apt.time.substring(0, 5) : apt.time) : "";
                        return (
                          <option key={apt.a_id} value={apt.a_id}>
                            {patientName} - {appointmentDate} {appointmentTime && `at ${appointmentTime}`}
                          </option>
                        );
                      })
                    ) : (
                      <option value="" disabled>No completed appointments available</option>
                    )}
                  </>
                )}
              </select>
              {selectedAppointmentId && (
                <p style={{ color: "#0077b6", fontSize: "14px", marginTop: "5px", fontStyle: "italic" }}>
                  ✓ Appointment pre-selected from Appointments tab
                </p>
              )}
              {appointments.length === 0 && (
                <p style={{ color: "#666", fontSize: "14px", marginTop: "5px" }}>
                  No completed appointments available for consultation
                </p>
              )}
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                Symptoms / Notes:
              </label>
              <textarea
                value={formData.symptoms}
                onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                required
                rows="4"
                placeholder="Enter patient symptoms, diagnosis notes, etc."
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "5px",
                  border: "1px solid #ccc",
                  fontSize: "14px",
                  fontFamily: "inherit",
                }}
              />
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                Prescription:
              </label>
              <textarea
                value={formData.prescription}
                onChange={(e) => setFormData({ ...formData, prescription: e.target.value })}
                required
                rows="4"
                placeholder="Enter prescription details, medications, dosage, etc."
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "5px",
                  border: "1px solid #ccc",
                  fontSize: "14px",
                  fontFamily: "inherit",
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "10px 30px",
                backgroundColor: loading ? "#ccc" : "#28a745",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: "16px",
                fontWeight: "bold",
              }}
            >
              {loading ? "Saving..." : "Save Consultation"}
            </button>
          </form>
        </div>
      )}

      <h2 style={{ marginTop: "30px", marginBottom: "15px" }}>Consultation Records</h2>
      {consultations.length > 0 ? (
        <table border="1" cellPadding="8" style={{ width: "100%", textAlign: "left", borderCollapse: "collapse", backgroundColor: "white" }}>
          <thead>
            <tr style={{ backgroundColor: "#0077b6", color: "white" }}>
              <th style={{ padding: "12px" }}>ID</th>
              <th style={{ padding: "12px" }}>Patient</th>
              <th style={{ padding: "12px" }}>Doctor</th>
              <th style={{ padding: "12px" }}>Date</th>
              <th style={{ padding: "12px" }}>Symptoms</th>
              <th style={{ padding: "12px" }}>Prescription</th>
              <th style={{ padding: "12px" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {consultations.map((c) => (
              <tr key={c.id} style={{ borderBottom: "1px solid #dee2e6" }}>
                <td style={{ padding: "10px" }}>{c.id}</td>
                <td style={{ padding: "10px" }}>{c.patient}</td>
                <td style={{ padding: "10px" }}>{c.doctor}</td>
                <td style={{ padding: "10px" }}>{c.date}</td>
                <td style={{ padding: "10px", maxWidth: "300px" }}>{c.symptoms || "-"}</td>
                <td style={{ padding: "10px", maxWidth: "300px" }}>{c.prescription || "-"}</td>
                <td style={{ padding: "10px" }}>
                  <button
                    onClick={() => deleteConsultation(c.id)}
                    disabled={deletingIds.includes(c.id)}
                    style={{
                      backgroundColor: deletingIds.includes(c.id) ? "#ccc" : "#dc3545",
                      color: "white",
                      border: "none",
                      padding: "6px 12px",
                      borderRadius: "4px",
                      cursor: deletingIds.includes(c.id) ? "not-allowed" : "pointer",
                      fontSize: "13px",
                    }}
                  >
                    {deletingIds.includes(c.id) ? "Deleting..." : "Delete"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p style={{ color: "#666", textAlign: "center", padding: "20px" }}>
          No consultations found. Add a consultation using the button above.
        </p>
      )}
    </div>
  );
};

export default Consultations;
