import React, { useState, useEffect } from "react";
import "./bookappointment.css"; // ✅ You can create this for styling (see below)

const BookAppointment = ({ onBookingSuccess }) => {
  const [doctors, setDoctors] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [formData, setFormData] = useState({
    doctor_id: "",
    date: "",
    time: "",
  });

  // ✅ use the same key as dashboard
  const patientId = localStorage.getItem("userId");

  // ✅ Fetch doctor list
  useEffect(() => {
    fetch("http://localhost:5050/doctors")
      .then((res) => res.json())
      .then((data) => setDoctors(data))
      .catch((err) => console.error("Error fetching doctors:", err));
  }, []);

  // Fetch available slots when doctor or date changes
  useEffect(() => {
    const { doctor_id, date } = formData;
    if (!doctor_id || !date) {
      setAvailableSlots([]);
      return;
    }
    const fetchSlots = async () => {
      try {
        setLoadingSlots(true);
        const res = await fetch(
          `http://localhost:5050/doctors/${doctor_id}/available_slots?date=${date}`
        );
        const data = await res.json();
        setAvailableSlots(data.slots || []);
        // Reset time if no longer available
        if (!data.slots?.some((s) => s.start === formData.time)) {
          setFormData((prev) => ({ ...prev, time: "" }));
        }
      } catch (e) {
        console.error("Error fetching available slots:", e);
        setAvailableSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };
    fetchSlots();
  }, [formData.doctor_id, formData.date]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!patientId) {
      alert("Please log in first.");
      return;
    }

    fetch("http://localhost:5050/book_appointment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        p_id: patientId,
        d_id: formData.doctor_id,
        date: formData.date,
        time: formData.time,
      }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          const msg = data.error || "Failed to book appointment";
          // If slot full, nudge user
          if (data.details?.slot_start && data.details?.slot_end) {
            alert(
              `${msg}. Please pick another slot. (${data.details.slot_start}-${data.details.slot_end} is full)`
            );
          } else {
            alert(msg);
          }
          // Refresh slots to reflect latest
          return Promise.reject(new Error(msg));
        }
        alert(data.message || "Appointment booked successfully!");
        setFormData({ doctor_id: "", date: "", time: "" });
        setAvailableSlots([]);
        // Refresh appointments in dashboard if callback provided
        if (onBookingSuccess) {
          onBookingSuccess();
          // Switch to dashboard tab after booking
          setTimeout(() => {
            if (window.location.pathname === "/patients") {
              // If we're in the patient dashboard, we can trigger tab switch via event
              window.dispatchEvent(new CustomEvent("switchToDashboard"));
            }
          }, 500);
        }
      })
      .catch((err) => {
        console.error("Error booking appointment:", err);
        // no-op, already alerted above
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

        <label>Time slot:</label>
        <select
          value={formData.time}
          onChange={(e) => setFormData({ ...formData, time: e.target.value })}
          required
          disabled={!formData.doctor_id || !formData.date || loadingSlots}
        >
          <option value="">
            {loadingSlots
              ? "Loading slots..."
              : !formData.doctor_id || !formData.date
              ? "Select doctor and date first"
              : availableSlots.length === 0
              ? "No slots available"
              : "Select a slot"}
          </option>
          {availableSlots.map((s) => (
            <option key={s.start} value={s.start}>
              {s.start} - {s.end} (remaining {s.remaining})
            </option>
          ))}
        </select>

        <button type="submit" className="submit-btn">
          Book Appointment
        </button>
      </form>
    </div>
  );
};

export default BookAppointment;
