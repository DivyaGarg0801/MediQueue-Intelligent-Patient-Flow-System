import React from "react";
import { Heart, CalendarDays, Users, Activity } from "lucide-react";
import "./home.css";

const Home = () => {
  return (
    <div className="home-container">
      {/* Header / Navbar */}
      <header className="home-header">
        <div className="logo">
          <Heart className="icon" />
          <span>ClinicCare</span>
        </div>
        <nav>
          <a href="/">Home</a>
          <a href="/login">Login</a>
          <a href="/register" className="highlight">
            Register
          </a>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-text">
          <h1>Your Health, Our Priority ❤️</h1>
          <p>
            ClinicCare makes patient management effortless — from online
            appointments to real-time queue tracking and secure record keeping.
          </p>
          <div className="hero-buttons">
            <a href="/login" className="btn btn-primary">
              Login
            </a>
            <a href="/register" className="btn btn-outline">
              Register as Patient
            </a>
          </div>
        </div>
        <div className="hero-image">
          <img
            src="https://cdn-icons-png.flaticon.com/512/2966/2966327.png"
            alt="ClinicCare Illustration"
          />
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <h2>Why Choose ClinicCare?</h2>
        <div className="feature-cards">
          <div className="feature-card">
            <CalendarDays className="feature-icon" />
            <h3>Easy Appointments</h3>
            <p>Book appointments anytime and avoid long waiting lines.</p>
          </div>

          <div className="feature-card">
            <Users className="feature-icon" />
            <h3>Real-Time Queue</h3>
            <p>Track your position live in the clinic queue system.</p>
          </div>

          <div className="feature-card">
            <Activity className="feature-icon" />
            <h3>Smart Health Records</h3>
            <p>Keep your medical records organized and accessible securely.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <p>© {new Date().getFullYear()} ClinicCare | Designed with ❤️ for better healthcare</p>
      </footer>
    </div>
  );
};

export default Home;
