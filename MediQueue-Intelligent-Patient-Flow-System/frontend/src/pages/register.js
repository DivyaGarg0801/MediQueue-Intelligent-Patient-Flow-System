import React, { useState } from "react";
import { Heart, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./register.css";

const Register = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    mobile: "",
    age: "",
    gender: "",
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.fullName || !formData.mobile || !formData.age || !formData.gender) {
      alert("Please fill in all fields.");
      return;
    }

    if (formData.mobile.length !== 10) {
      alert("Enter a valid 10-digit mobile number");
      return;
    }

    try {
      const response = await fetch("http://localhost:5050/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          p_name: formData.fullName,
          contact: formData.mobile,
          age: formData.age,
          gender: formData.gender,
        }),
      });

      if (response.ok) {
        alert("✅ Registration successful! You can now login as a Patient.");
        navigate("/login");
      } else {
        const errData = await response.json();
        alert(`Error: ${errData.message || "Something went wrong."}`);
      }
    } catch (err) {
      console.error(err);
      alert("Error connecting to server. Please try again later.");
    }
  };

  return (
    <div className="register-container">
      <div className="register-box">
        {/* Left Info */}
        <div className="register-info">
          <h2>
            <Heart style={{ marginRight: "8px" }} /> ClinicCare
          </h2>
          <p>Modern Healthcare Management</p>
          <ul>
            <li>• Manage appointments easily</li>
            <li>• Track queue and health records</li>
            <li>• Access from anywhere securely</li>
          </ul>
        </div>

        {/* Right Form */}
        <div className="register-form">
          <h2>Create a Patient Account</h2>
          <p>Only patients can register. Doctors and Admins are added by the clinic.</p>

          <form onSubmit={handleSubmit}>
            <label>Full Name</label>
            <input
              type="text"
              name="fullName"
              placeholder="Enter your full name"
              value={formData.fullName}
              onChange={handleChange}
              required
            />

            <label>Mobile Number</label>
            <input
              type="text"
              name="mobile"
              placeholder="Enter your mobile number"
              value={formData.mobile}
              onChange={handleChange}
              required
            />

            <label>Age</label>
            <input
              type="number"
              name="age"
              placeholder="Enter your age"
              value={formData.age}
              onChange={handleChange}
              required
            />

            <label>Gender</label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              required
            >
              <option value="">Select Gender</option>
              <option value="Female">Female</option>
              <option value="Male">Male</option>
              <option value="Other">Other</option>
            </select>

            <button type="submit" className="register-button">
              <UserPlus style={{ marginRight: "6px" }} /> Register
            </button>
          </form>

          <p className="login-text">
            Already have an account? <a href="/login">Login here</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
