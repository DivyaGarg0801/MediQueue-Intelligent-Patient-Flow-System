import React, { useState, useEffect } from "react";
import "./adminDashboard.css";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("patients");
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [showPatientForm, setShowPatientForm] = useState(false);
  const [showDoctorForm, setShowDoctorForm] = useState(false);
  const [patientForm, setPatientForm] = useState({
    p_name: "",
    age: "",
    gender: "",
    contact: "",
  });
  const [doctorForm, setDoctorForm] = useState({
    d_name: "",
    specialization: "",
    availability: "",
    contact: "",
  });
  const [loading, setLoading] = useState(false);
  const [deletingIds, setDeletingIds] = useState({ patients: [], doctors: [] });

  // Fetch patients
  const fetchPatients = async () => {
    try {
      const res = await fetch("http://localhost:5050/patients");
      const data = await res.json();
      setPatients(data);
    } catch (err) {
      console.error("Error fetching patients:", err);
    }
  };

  // Fetch doctors
  const fetchDoctors = async () => {
    try {
      const res = await fetch("http://localhost:5050/doctors");
      const data = await res.json();
      setDoctors(data);
    } catch (err) {
      console.error("Error fetching doctors:", err);
    }
  };

  useEffect(() => {
    fetchPatients();
    fetchDoctors();
  }, []);

  // Add Patient
  const handleAddPatient = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5050/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patientForm),
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || "Patient added successfully!");
        setPatientForm({ p_name: "", age: "", gender: "", contact: "" });
        setShowPatientForm(false);
        fetchPatients();
      } else {
        alert(data.error || "Failed to add patient");
      }
    } catch (err) {
      console.error("Error adding patient:", err);
      alert("Error adding patient. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Add Doctor
  const handleAddDoctor = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5050/doctors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(doctorForm),
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || "Doctor added successfully!");
        setDoctorForm({ d_name: "", specialization: "", availability: "", contact: "" });
        setShowDoctorForm(false);
        fetchDoctors();
      } else {
        alert(data.error || "Failed to add doctor");
      }
    } catch (err) {
      console.error("Error adding doctor:", err);
      alert("Error adding doctor. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Delete Patient
  const deletePatient = async (p_id) => {
    if (!window.confirm("Are you sure you want to delete this patient? This action cannot be undone.")) {
      return;
    }

    if (deletingIds.patients.includes(p_id)) return;
    setDeletingIds((prev) => ({ ...prev, patients: [...prev.patients, p_id] }));

    try {
      const res = await fetch(`http://localhost:5050/patients/${p_id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || "Patient deleted successfully!");
        fetchPatients();
      } else {
        alert(data.error || "Failed to delete patient");
      }
    } catch (err) {
      console.error("Error deleting patient:", err);
      alert("Error deleting patient. Please try again.");
    } finally {
      setDeletingIds((prev) => ({ ...prev, patients: prev.patients.filter((id) => id !== p_id) }));
    }
  };

  // Delete Doctor
  const deleteDoctor = async (d_id) => {
    if (!window.confirm("Are you sure you want to delete this doctor? This action cannot be undone.")) {
      return;
    }

    if (deletingIds.doctors.includes(d_id)) return;
    setDeletingIds((prev) => ({ ...prev, doctors: [...prev.doctors, d_id] }));

    try {
      const res = await fetch(`http://localhost:5050/doctors/${d_id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || "Doctor deleted successfully!");
        fetchDoctors();
      } else {
        alert(data.error || "Failed to delete doctor");
      }
    } catch (err) {
      console.error("Error deleting doctor:", err);
      alert("Error deleting doctor. Please try again.");
    } finally {
      setDeletingIds((prev) => ({ ...prev, doctors: prev.doctors.filter((id) => id !== d_id) }));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("userId");
    localStorage.removeItem("role");
    window.location.href = "/login";
  };

  return (
    <div className="admin-dashboard">
      <aside className="sidebar">
        <h2>Admin Dashboard</h2>
        <ul>
          <li
            className={activeTab === "patients" ? "active" : ""}
            onClick={() => setActiveTab("patients")}
          >
            Patients
          </li>
          <li
            className={activeTab === "doctors" ? "active" : ""}
            onClick={() => setActiveTab("doctors")}
          >
            Doctors
          </li>
          <li onClick={handleLogout}>Logout</li>
        </ul>
      </aside>

      <main className="content">
        {activeTab === "patients" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h1>Patients Management</h1>
              <button
                onClick={() => setShowPatientForm(!showPatientForm)}
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
                {showPatientForm ? "Cancel" : "+ Add Patient"}
              </button>
            </div>

            {showPatientForm && (
              <div
                style={{
                  backgroundColor: "#f8f9fa",
                  padding: "20px",
                  borderRadius: "8px",
                  marginBottom: "30px",
                  border: "1px solid #dee2e6",
                }}
              >
                <h2 style={{ marginTop: 0, marginBottom: "20px" }}>Add New Patient</h2>
                <form onSubmit={handleAddPatient}>
                  <div style={{ marginBottom: "15px" }}>
                    <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                      Name:
                    </label>
                    <input
                      type="text"
                      value={patientForm.p_name}
                      onChange={(e) => setPatientForm({ ...patientForm, p_name: e.target.value })}
                      required
                      style={{ width: "100%", padding: "8px", borderRadius: "5px", border: "1px solid #ccc" }}
                    />
                  </div>
                  <div style={{ marginBottom: "15px" }}>
                    <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                      Age:
                    </label>
                    <input
                      type="number"
                      value={patientForm.age}
                      onChange={(e) => setPatientForm({ ...patientForm, age: e.target.value })}
                      required
                      min="1"
                      style={{ width: "100%", padding: "8px", borderRadius: "5px", border: "1px solid #ccc" }}
                    />
                  </div>
                  <div style={{ marginBottom: "15px" }}>
                    <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                      Gender:
                    </label>
                    <select
                      value={patientForm.gender}
                      onChange={(e) => setPatientForm({ ...patientForm, gender: e.target.value })}
                      required
                      style={{ width: "100%", padding: "8px", borderRadius: "5px", border: "1px solid #ccc" }}
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div style={{ marginBottom: "15px" }}>
                    <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                      Contact (10 digits):
                    </label>
                    <input
                      type="text"
                      value={patientForm.contact}
                      onChange={(e) => setPatientForm({ ...patientForm, contact: e.target.value })}
                      required
                      maxLength="10"
                      pattern="[0-9]{10}"
                      style={{ width: "100%", padding: "8px", borderRadius: "5px", border: "1px solid #ccc" }}
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
                    {loading ? "Saving..." : "Add Patient"}
                  </button>
                </form>
              </div>
            )}

            <table border="1" cellPadding="10" style={{ borderCollapse: "collapse", width: "100%", backgroundColor: "white" }}>
              <thead>
                <tr style={{ backgroundColor: "#0077b6", color: "white" }}>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Age</th>
                  <th>Gender</th>
                  <th>Contact</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {patients.length > 0 ? (
                  patients.map((p) => (
                    <tr key={p.p_id}>
                      <td>{p.p_id}</td>
                      <td>{p.p_name}</td>
                      <td>{p.age}</td>
                      <td>{p.gender}</td>
                      <td>{p.contact}</td>
                      <td>
                        <button
                          onClick={() => deletePatient(p.p_id)}
                          disabled={deletingIds.patients.includes(p.p_id)}
                          style={{
                            backgroundColor: deletingIds.patients.includes(p.p_id) ? "#ccc" : "#dc3545",
                            color: "white",
                            border: "none",
                            padding: "6px 12px",
                            borderRadius: "4px",
                            cursor: deletingIds.patients.includes(p.p_id) ? "not-allowed" : "pointer",
                            fontSize: "13px",
                          }}
                        >
                          {deletingIds.patients.includes(p.p_id) ? "Deleting..." : "Delete"}
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" style={{ textAlign: "center", padding: "20px" }}>
                      No patients found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "doctors" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h1>Doctors Management</h1>
              <button
                onClick={() => setShowDoctorForm(!showDoctorForm)}
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
                {showDoctorForm ? "Cancel" : "+ Add Doctor"}
              </button>
            </div>

            {showDoctorForm && (
              <div
                style={{
                  backgroundColor: "#f8f9fa",
                  padding: "20px",
                  borderRadius: "8px",
                  marginBottom: "30px",
                  border: "1px solid #dee2e6",
                }}
              >
                <h2 style={{ marginTop: 0, marginBottom: "20px" }}>Add New Doctor</h2>
                <form onSubmit={handleAddDoctor}>
                  <div style={{ marginBottom: "15px" }}>
                    <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                      Name:
                    </label>
                    <input
                      type="text"
                      value={doctorForm.d_name}
                      onChange={(e) => setDoctorForm({ ...doctorForm, d_name: e.target.value })}
                      required
                      style={{ width: "100%", padding: "8px", borderRadius: "5px", border: "1px solid #ccc" }}
                    />
                  </div>
                  <div style={{ marginBottom: "15px" }}>
                    <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                      Specialization:
                    </label>
                    <input
                      type="text"
                      value={doctorForm.specialization}
                      onChange={(e) => setDoctorForm({ ...doctorForm, specialization: e.target.value })}
                      required
                      style={{ width: "100%", padding: "8px", borderRadius: "5px", border: "1px solid #ccc" }}
                    />
                  </div>
                  <div style={{ marginBottom: "15px" }}>
                    <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                      Availability:
                    </label>
                    <input
                      type="text"
                      value={doctorForm.availability}
                      onChange={(e) => setDoctorForm({ ...doctorForm, availability: e.target.value })}
                      required
                      placeholder="e.g., Mon-Sat 9am-5pm"
                      style={{ width: "100%", padding: "8px", borderRadius: "5px", border: "1px solid #ccc" }}
                    />
                  </div>
                  <div style={{ marginBottom: "15px" }}>
                    <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                      Contact (10 digits):
                    </label>
                    <input
                      type="text"
                      value={doctorForm.contact}
                      onChange={(e) => setDoctorForm({ ...doctorForm, contact: e.target.value })}
                      required
                      maxLength="10"
                      pattern="[0-9]{10}"
                      style={{ width: "100%", padding: "8px", borderRadius: "5px", border: "1px solid #ccc" }}
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
                    {loading ? "Saving..." : "Add Doctor"}
                  </button>
                </form>
              </div>
            )}

            <table border="1" cellPadding="10" style={{ borderCollapse: "collapse", width: "100%", backgroundColor: "white" }}>
              <thead>
                <tr style={{ backgroundColor: "#0077b6", color: "white" }}>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Specialization</th>
                  <th>Availability</th>
                  <th>Contact</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {doctors.length > 0 ? (
                  doctors.map((d) => (
                    <tr key={d.d_id}>
                      <td>{d.d_id}</td>
                      <td>{d.d_name}</td>
                      <td>{d.specialization}</td>
                      <td>{d.availability}</td>
                      <td>{d.contact}</td>
                      <td>
                        <button
                          onClick={() => deleteDoctor(d.d_id)}
                          disabled={deletingIds.doctors.includes(d.d_id)}
                          style={{
                            backgroundColor: deletingIds.doctors.includes(d.d_id) ? "#ccc" : "#dc3545",
                            color: "white",
                            border: "none",
                            padding: "6px 12px",
                            borderRadius: "4px",
                            cursor: deletingIds.doctors.includes(d.d_id) ? "not-allowed" : "pointer",
                            fontSize: "13px",
                          }}
                        >
                          {deletingIds.doctors.includes(d.d_id) ? "Deleting..." : "Delete"}
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" style={{ textAlign: "center", padding: "20px" }}>
                      No doctors found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;

