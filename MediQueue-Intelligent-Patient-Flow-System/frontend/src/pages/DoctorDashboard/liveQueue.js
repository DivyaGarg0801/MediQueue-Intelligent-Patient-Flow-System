import React, { useEffect, useState } from "react";

const LiveQueue = () => {
  const [liveQueue, setLiveQueue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchLiveQueue = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("http://localhost:5050/queue/live");
      
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || "Failed to fetch live queue");
      }
      
      const data = await res.json();
      setLiveQueue(data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Error fetching live queue:", err);
      setError(err.message || "Error fetching live queue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch immediately when component mounts
    fetchLiveQueue();
    
    // Refresh every 30 seconds
    const intervalId = setInterval(fetchLiveQueue, 30000);
    
    return () => clearInterval(intervalId);
  }, []);

  const formatTime = (timeStr) => {
    if (!timeStr) return "--";
    try {
      const date = new Date(timeStr);
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    } catch {
      return timeStr;
    }
  };

  if (loading && !liveQueue) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <h1>Live Queue</h1>
        <p>Loading current appointments...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "20px" }}>
        <h1>Live Queue</h1>
        <div style={{ color: "red", padding: "10px", backgroundColor: "#ffe6e6", borderRadius: "5px" }}>
          Error: {error}
        </div>
        <button
          onClick={fetchLiveQueue}
          style={{
            marginTop: "10px",
            padding: "8px 16px",
            backgroundColor: "#0077b6",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  const currentTime = liveQueue?.current_time 
    ? formatTime(liveQueue.current_time) 
    : new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const timeSlot = liveQueue?.time_slot;
  const appointments = liveQueue?.appointments || [];

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h1>Live Queue</h1>
        <button
          onClick={fetchLiveQueue}
          disabled={loading}
          style={{
            padding: "8px 16px",
            backgroundColor: loading ? "#ccc" : "#0077b6",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: loading ? "not-allowed" : "pointer",
            fontSize: "14px",
          }}
        >
          {loading ? "Refreshing..." : "🔄 Refresh"}
        </button>
      </div>

      <div style={{ 
        backgroundColor: "#f8f9fa", 
        padding: "15px", 
        borderRadius: "8px", 
        marginBottom: "20px",
        border: "1px solid #dee2e6"
      }}>
        <div style={{ display: "flex", gap: "30px", flexWrap: "wrap" }}>
          <div>
            <strong>Current Time:</strong> {currentTime}
          </div>
          {timeSlot && (
            <div>
              <strong>Time Slot:</strong> {timeSlot.start} - {timeSlot.end}
            </div>
          )}
          <div>
            <strong>Appointments:</strong> {appointments.length}
          </div>
          {lastUpdated && (
            <div style={{ color: "#666", fontSize: "14px" }}>
              Last updated: {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </div>
          )}
        </div>
      </div>

      {appointments.length === 0 ? (
        <div style={{
          textAlign: "center",
          padding: "40px",
          backgroundColor: "#fff",
          borderRadius: "8px",
          border: "2px dashed #dee2e6"
        }}>
          <h2 style={{ color: "#6c757d", marginBottom: "10px" }}>No Appointments Right Now</h2>
          {liveQueue?.message ? (
            <p style={{ color: "#6c757d" }}>{liveQueue.message}</p>
          ) : (
            <p style={{ color: "#6c757d" }}>
              There are no appointments scheduled in the current time slot.
            </p>
          )}
        </div>
      ) : (
        <div style={{
          textAlign: "center",
          padding: "40px",
          backgroundColor: "#fff",
          borderRadius: "8px",
          border: "2px solid #0077b6",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
        }}>
          <h2 style={{ color: "#0d3b66", marginBottom: "20px", fontSize: "28px" }}>
            {appointments.length} {appointments.length === 1 ? "Patient" : "Patients"}
          </h2>
          <p style={{ color: "#666", fontSize: "18px", margin: 0 }}>
            in this time slot ({timeSlot?.start} - {timeSlot?.end})
          </p>
        </div>
      )}
    </div>
  );
};

export default LiveQueue;

