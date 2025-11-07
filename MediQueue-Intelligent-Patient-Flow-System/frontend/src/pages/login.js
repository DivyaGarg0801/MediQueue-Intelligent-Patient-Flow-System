import React, { useState } from "react";
import { User, Stethoscope, ShieldCheck, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./login.css";

const Login = () => {
  const [role, setRole] = useState("patient");
  const [mobile, setMobile] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [enteredOtp, setEnteredOtp] = useState("");
  const [userId, setUserId] = useState(null);

  const navigate = useNavigate();

  // Step 1: Send OTP
  const sendOtp = async () => {
    if (!mobile || mobile.length !== 10) {
      alert("Enter a valid 10-digit mobile number");
      return;
    }

    try {
      let url = "";
      if (role === "patient") url = "http://localhost:5050/patients";
      else if (role === "doctor") url = "http://localhost:5050/doctors";
      else if (role === "admin") url = "http://localhost:5050/admins";

      const res = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${res.status} ${res.statusText}`);
      }
      
      const data = await res.json();

      if (!Array.isArray(data)) {
        throw new Error("Invalid response from server");
      }

      // find record with same contact
      const user = data.find((u) => u.contact === mobile);

      if (!user) {
        alert(`No ${role} found with this mobile number. Please register first.`);
        return;
      }

      // Generate and store OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(otp);
      setOtpSent(true);
      setUserId(user.p_id || user.d_id || user.admin_id);

      alert(`Your OTP is: ${otp}`); // Demo only
    } catch (err) {
      console.error("Login error:", err);
      if (err.message.includes("Failed to fetch") || err.message.includes("NetworkError")) {
        alert("Cannot connect to server. Please make sure the backend server is running on port 5050.\n\nTo start the server, run: python app.py");
      } else {
        alert(`Error checking user data: ${err.message || "Please check if the server is running and try again."}`);
      }
    }
  };

  // Step 2: Verify OTP
  const verifyOtp = () => {
    if (enteredOtp === generatedOtp) {
      alert("OTP verified! Redirecting to your dashboard...");

      // store role and userId for session
      localStorage.setItem("role", role);
      localStorage.setItem("userId", userId);

      if (role === "patient") navigate("/patients");
      else if (role === "doctor") navigate("/doctors");
      else if (role === "admin") navigate("/admin");
    } else {
      alert("Invalid OTP. Try again.");
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        {/* Left Info */}
        <div className="left-info">
          <h2>
            <Heart className="icon" style={{ marginRight: "8px" }} />
            ClinicCare
          </h2>
          <p>Modern Healthcare Management</p>
          <ul>
            <li>• Easy Appointment Booking</li>
            <li>• Real-time Queue Status</li>
            <li>• Complete Health Records</li>
          </ul>
        </div>

        {/* Right Form */}
        <div className="login-form">
          <h2>Welcome back</h2>
          <p>Select your role and enter your mobile number</p>

          <div className="role-buttons">
            {[
              { id: "patient", icon: <User />, label: "Patient" },
              { id: "doctor", icon: <Stethoscope />, label: "Doctor" },
              { id: "admin", icon: <ShieldCheck />, label: "Admin" },
            ].map((r) => (
              <button
                key={r.id}
                onClick={() => setRole(r.id)}
                className={`role-button ${role === r.id ? "active" : ""}`}
              >
                {r.icon}
                <span>{r.label}</span>
              </button>
            ))}
          </div>

          <label>Mobile Number</label>
          <input
            type="text"
            placeholder="Enter your mobile number"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            disabled={otpSent}
          />

          {otpSent && (
            <>
              <label>Enter OTP</label>
              <input
                type="text"
                placeholder="Enter OTP"
                value={enteredOtp}
                onChange={(e) => setEnteredOtp(e.target.value)}
              />
            </>
          )}

          <button
            className="login-button"
            onClick={otpSent ? verifyOtp : sendOtp}
          >
            {otpSent ? "Verify OTP" : "Send OTP"}
          </button>

          <p className="register-text">
            Don’t have an account? <a href="/register">Register here</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
