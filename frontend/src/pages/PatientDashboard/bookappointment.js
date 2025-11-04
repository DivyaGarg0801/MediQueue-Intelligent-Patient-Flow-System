import React, { useState, useEffect } from "react";
import "./bookappointment.css"; // ✅ You can create this for styling (see below)

const BookAppointment = () => {
  const [doctors, setDoctors] = useState([]);
  const [formData, setFormData] = useState({
    doctor_id: "",
    date: "",
    time: "",
  });

  // ✅ use the same key as dashboard
  const patientId = localStorage.getItem("userId");

  // ✅ Fetch doctor list
  useEffect(() => {
    fetch("http://localhost:5000/doctors")
      .then((res) => res.json())
      .then((data) => setDoctors(data))
      .catch((err) => console.error("Error fetching doctors:", err));
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!patientId) {
      alert("Please log in first.");
      return;
    }

    fetch("http://localhost:5000/book_appointment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        p_id: patientId,
        d_id: formData.doctor_id,
        date: formData.date,
        time: formData.time,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        alert(data.message || "Appointment booked successfully!");
        setFormData({ doctor_id: "", date: "", time: "" });
      })
      .catch((err) => {
        console.error("Error booking appointment:", err);
        alert("Failed to book appointment");
      });
  };

  return (
    <div className="book-appointment">
      <h2>Book an Appointment</h2>

      <form onSubmit={handleSubmit}>
        <label>Doctor:</label>
        <select
          value={formData.doctor_id}
          onChange={(e) =>
            setFormData({ ...formData, doctor_id: e.target.value })
          }
          required
        >
          <option value="">Select a doctor</option>
          {doctors.map((d) => (
            <option key={d.d_id} value={d.d_id}>
              {d.d_name} — {d.specialization}
            </option>
          ))}
        </select>

        <label>Date:</label>
        <input
          type="date"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          required
        />

        <label>Time:</label>
        <input
          type="time"
          value={formData.time}
          onChange={(e) => setFormData({ ...formData, time: e.target.value })}
          required
        />

        <button type="submit" className="submit-btn">
          Book Appointment
        </button>
      </form>
    </div>
  );
};

export default BookAppointment;
