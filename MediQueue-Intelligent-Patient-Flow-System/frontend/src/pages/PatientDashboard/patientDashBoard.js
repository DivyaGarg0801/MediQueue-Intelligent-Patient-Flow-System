import React, { useCallback, useEffect, useState } from "react";
import "./patientDashboard.css";
import BookAppointment from "./bookappointment";

const PatientDashboard = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [patientData, setPatientData] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [past, setPast] = useState([]);
  const [queueInfo, setQueueInfo] = useState({ loading: true, data: null, error: null });
  const [liveQueue, setLiveQueue] = useState({ loading: true, data: null, error: null });

  const userId = localStorage.getItem("userId");

  // ✅ Fetch patient details
  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        const res = await fetch(`http://localhost:5050/patients/${userId}`);
        const data = await res.json();
        setPatientData(data);
      } catch (err) {
        console.error("Error fetching patient data:", err);
      }
    };
    if (userId) {
      fetchPatientData();
    }
  }, [userId]);

  // ✅ Fetch and filter appointments
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const res = await fetch("http://localhost:5050/appointments");
        const data = await res.json();

        if (patientData && patientData.p_name) {
          const patientAppointments = data.filter(
            (a) => a.patient.toLowerCase() === patientData.p_name.toLowerCase()
          );

          const today = new Date().toISOString().split("T")[0];

          const upcomingList = patientAppointments
            .filter(
              (a) =>
                (a.status === "Scheduled" || a.date >= today)
            )
            .sort((a, b) => {
              // Sort by date first, then by time
              if (a.date !== b.date) {
                return a.date.localeCompare(b.date);
              }
              return (a.time || "").localeCompare(b.time || "");
            });

          const pastList = patientAppointments.filter(
            (a) =>
              (a.status === "Completed" || a.date < today)
          );

          setAppointments(patientAppointments);
          setUpcoming(upcomingList);
          setPast(pastList);
        }
      } catch (err) {
        console.error("Error fetching appointments:", err);
      }
    };
    if (patientData) {
      fetchAppointments();
    }
  }, [patientData]);

  const fetchQueueStatus = useCallback(async ({ showLoader = false } = {}) => {
    if (!patientData) return;

    setQueueInfo((prev) => ({
      ...prev,
      loading: showLoader || !prev.data,
    }));

    try {
      const res = await fetch(`http://localhost:5050/queue/patient/${patientData.p_id}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Unable to load queue status");
      }

      setQueueInfo({ loading: false, data, error: null });
    } catch (err) {
      setQueueInfo({ loading: false, data: null, error: err.message });
    }
  }, [patientData]);

  useEffect(() => {
    if (!patientData) return;

    fetchQueueStatus({ showLoader: true });
    const intervalId = setInterval(() => fetchQueueStatus(), 30000);

    return () => clearInterval(intervalId);
  }, [patientData, fetchQueueStatus]);

  // Fetch live queue (current time slot appointments)
  const fetchLiveQueue = useCallback(async () => {
    setLiveQueue((prev) => ({ ...prev, loading: true }));
    try {
      const res = await fetch("http://localhost:5050/queue/live");
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Unable to load live queue");
      }
      setLiveQueue({ loading: false, data, error: null });
    } catch (err) {
      setLiveQueue({ loading: false, data: null, error: err.message });
    }
  }, []);

  useEffect(() => {
    fetchLiveQueue();
    const intervalId = setInterval(fetchLiveQueue, 30000); // Refresh every 30 seconds
    return () => clearInterval(intervalId);
  }, [fetchLiveQueue]);

  const formatWaitTime = (minutes) => {
    if (minutes === 0) return "Ready now";
    if (!minutes || minutes < 0) return "Pending";
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs > 0) {
      return `${hrs} hr${hrs > 1 ? "s" : ""}${mins ? ` ${mins} min` : ""}`;
    }
    return `${minutes} min`;
  };

  // Check if appointment slot has started
  const getSlotInfo = (queueData) => {
    if (!queueData?.appointment?.date || !queueData?.appointment?.time) {
      return null;
    }

    const now = new Date();
    const appointmentDate = queueData.appointment.date;
    const appointmentTime = queueData.appointment.time;
    
    try {
      // Parse appointment date (format: YYYY-MM-DD or ISO string)
      let appointmentDateTime;
      if (typeof appointmentDate === 'string') {
        // If it's just a date string (YYYY-MM-DD), combine with time
        if (appointmentDate.includes('T')) {
          appointmentDateTime = new Date(appointmentDate);
        } else {
          // Parse time (format: HH:MM or HH:MM:SS)
          const timeParts = appointmentTime.split(':');
          const hours = parseInt(timeParts[0], 10) || 0;
          const minutes = parseInt(timeParts[1], 10) || 0;
          
          appointmentDateTime = new Date(appointmentDate);
          appointmentDateTime.setHours(hours, minutes, 0, 0);
        }
      } else {
        appointmentDateTime = new Date(appointmentDate);
      }

      // Check if current time is before appointment time
      if (now < appointmentDateTime) {
        // Slot hasn't started yet - show slot start time
        const timeStr = appointmentTime || "--";
        return {
          type: "slot_start",
          message: `Your slot starts at ${timeStr}`
        };
      } else {
        // Slot has started - check if patient is first in their time slot
        if (queueData.isFirstInSlot) {
          return {
            type: "wait_time",
            message: "You are next"
          };
        } else {
          // Show estimated wait time
          return {
            type: "wait_time",
            message: formatWaitTime(queueData.estimatedWaitMinutes || 0)
          };
        }
      }
    } catch (error) {
      console.error("Error parsing appointment date/time:", error);
      // Fallback to showing wait time if parsing fails
      return {
        type: "wait_time",
        message: formatWaitTime(queueData.estimatedWaitMinutes || 0)
      };
    }
  };

  const queueStatusClass = queueInfo.data?.queueStatus
    ? queueInfo.data.queueStatus.toLowerCase().replace(/\s+/g, "-")
    : "";

  // Listen for event to switch to dashboard tab after booking
  useEffect(() => {
    const handleSwitchToDashboard = () => {
      setActiveTab("dashboard");
    };
    window.addEventListener("switchToDashboard", handleSwitchToDashboard);
    return () => {
      window.removeEventListener("switchToDashboard", handleSwitchToDashboard);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("userId");
    localStorage.removeItem("role");
    window.location.href = "/login";
  };

  const refreshAppointments = () => {
    // Trigger refresh when appointment is booked
    if (patientData) {
      const fetchAppointments = async () => {
        try {
          const res = await fetch("http://localhost:5050/appointments");
          const data = await res.json();

          if (patientData && patientData.p_name) {
            const patientAppointments = data.filter(
              (a) => a.patient.toLowerCase() === patientData.p_name.toLowerCase()
            );

            const today = new Date().toISOString().split("T")[0];

            const upcomingList = patientAppointments.filter(
              (a) =>
                (a.status === "Scheduled" || a.date >= today)
            );

            const pastList = patientAppointments.filter(
              (a) =>
                (a.status === "Completed" || a.date < today)
            );

            setAppointments(patientAppointments);
            setUpcoming(upcomingList);
            setPast(pastList);
          }
        } catch (err) {
          console.error("Error fetching appointments:", err);
        }
      };
      fetchAppointments();
      fetchQueueStatus();
    }
  };

  if (!patientData) return <div className="loading">Loading Dashboard...</div>;

  return (
    <div className="patient-dashboard">
      <aside className="sidebar">
        <h2>Welcome, {patientData.p_name}</h2>
        <ul>
          <li 
            className={activeTab === "dashboard" ? "active" : ""}
            onClick={() => setActiveTab("dashboard")}
          >
            Dashboard
          </li>
          <li 
            className={activeTab === "bookappointment" ? "active" : ""}
            onClick={() => setActiveTab("bookappointment")}
          >
            Book Appointment
          </li>
          <li onClick={handleLogout}>Logout</li>
        </ul>
      </aside>

      <main className="content">
        {activeTab === "dashboard" && (
          <div className="dashboard-content">
            <div className="stats-section">
              <div className="stat-card">
                <h3>{upcoming.length}</h3>
                <p>Upcoming Appointments</p>
              </div>
              <div className="stat-card">
                <h3>{past.length}</h3>
                <p>Past Appointments</p>
              </div>
              <div className="stat-card queue-card">
                <h3>My Queue Status</h3>
                {queueInfo.loading ? (
                  <p className="queue-meta">Updating...</p>
                ) : queueInfo.error ? (
                  <p className="queue-error">{queueInfo.error}</p>
                ) : queueInfo.data?.inQueue ? (
                  <div className="queue-summary">
                    <span className={`queue-status-pill ${queueStatusClass}`}>
                      {queueInfo.data.queueStatus || "--"}
                    </span>
                    <p className="queue-meta">
                      <strong>
                        {queueInfo.data.position === 0
                          ? "With the doctor"
                          : `Position: #${queueInfo.data.position}`}
                      </strong>
                    </p>
                    {queueInfo.data.position > 0 && (
                      <p className="queue-meta">
                        {queueInfo.data.aheadCount > 0
                          ? `${queueInfo.data.aheadCount} ahead of you`
                          : "You're next"}
                      </p>
                    )}
                    <p className="queue-meta">
                      <strong>Doctor:</strong> {queueInfo.data.doctor?.name || "--"}
                    </p>
                    <p className="queue-meta">
                      <strong>Appointment:</strong> {queueInfo.data.appointment?.time || "--"} on {queueInfo.data.appointment?.date || "--"}
                    </p>
                    {(() => {
                      const slotInfo = getSlotInfo(queueInfo.data);
                      if (slotInfo) {
                        return (
                          <p className="queue-meta">
                            <strong>{slotInfo.type === "slot_start" ? "Slot Start:" : "Est. Wait:"}</strong> {slotInfo.message}
                          </p>
                        );
                      }
                      return null;
                    })()}
                    {queueInfo.data.lastUpdated && (
                      <p className="queue-refresh">
                        Last updated {new Date(queueInfo.data.lastUpdated).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="queue-meta">No active queue right now.</p>
                )}
              </div>
            </div>

            {/* Live Queue Section - Current Time Slot */}
            <div style={{ 
              marginTop: "30px", 
              padding: "20px", 
              backgroundColor: "#f8f9fa", 
              borderRadius: "10px",
              border: "1px solid #dee2e6"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                <h3 style={{ margin: 0, color: "#0d3b66" }}>Live Queue - Current Time Slot</h3>
                <button
                  onClick={fetchLiveQueue}
                  disabled={liveQueue.loading}
                  style={{
                    padding: "6px 12px",
                    backgroundColor: liveQueue.loading ? "#ccc" : "#0077b6",
                    color: "white",
                    border: "none",
                    borderRadius: "5px",
                    cursor: liveQueue.loading ? "not-allowed" : "pointer",
                    fontSize: "13px",
                  }}
                >
                  {liveQueue.loading ? "Refreshing..." : "🔄 Refresh"}
                </button>
              </div>
              
              {liveQueue.loading && !liveQueue.data ? (
                <p style={{ color: "#666" }}>Loading current appointments...</p>
              ) : liveQueue.error ? (
                <p style={{ color: "#d9534f" }}>Error: {liveQueue.error}</p>
              ) : liveQueue.data?.count === 0 ? (
                <div style={{ textAlign: "center", padding: "20px" }}>
                  <p style={{ color: "#6c757d", fontSize: "16px", margin: 0 }}>
                    <strong>No appointments right now</strong>
                  </p>
                  {liveQueue.data?.time_slot && (
                    <p style={{ color: "#6c757d", fontSize: "14px", marginTop: "5px" }}>
                      {liveQueue.data.message || 
                        `No appointments scheduled from ${liveQueue.data.time_slot.start} to ${liveQueue.data.time_slot.end}`}
                    </p>
                  )}
                </div>
              ) : (
                <div style={{
                  textAlign: "center",
                  padding: "30px",
                  backgroundColor: "#fff",
                  borderRadius: "8px",
                  border: "2px solid #0077b6",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                }}>
                  <h3 style={{ color: "#0d3b66", marginBottom: "15px", fontSize: "24px" }}>
                    {liveQueue.data.count} {liveQueue.data.count === 1 ? "Patient" : "Patients"}
                  </h3>
                  {liveQueue.data?.time_slot && (
                    <p style={{ color: "#666", fontSize: "16px", margin: 0 }}>
                      in this time slot ({liveQueue.data.time_slot.start} - {liveQueue.data.time_slot.end})
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="appointments-section">
              <h3>Upcoming Appointments</h3>
              {upcoming.length > 0 ? (
                <div className="appointment-list">
                  {upcoming.map((a) => (
                    <div key={a.id} className="appointment-card upcoming">
                      <p><strong>Doctor:</strong> {a.doctor}</p>
                      <p><strong>Date:</strong> {a.date}</p>
                      <p><strong>Time:</strong> {a.time}</p>
                      <p className="status">{a.status}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-msg">No upcoming appointments</p>
              )}

              <h3>Past Appointments</h3>
              {past.length > 0 ? (
                <div className="appointment-list">
                  {past.map((a) => (
                    <div key={a.id} className="appointment-card past">
                      <p><strong>Doctor:</strong> {a.doctor}</p>
                      <p><strong>Date:</strong> {a.date}</p>
                      <p><strong>Time:</strong> {a.time}</p>
                      <p className="status">{a.status}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-msg">No past appointments</p>
              )}
            </div>
          </div>
        )}

        {activeTab === "bookappointment" && (
          <BookAppointment onBookingSuccess={refreshAppointments} />
        )}
      </main>
    </div>
  );
};

export default PatientDashboard;
