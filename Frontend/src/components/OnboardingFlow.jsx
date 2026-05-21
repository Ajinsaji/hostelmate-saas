import React from "react";

const screenGradient = "linear-gradient(135deg, #138B67 0%, #1FA971 100%)";
const screenGlow = "0 22px 80px rgba(20, 241, 167, 0.22)";

const Arrow = () => (
  <div className="onboarding-arrow" aria-hidden="true">
    <svg width="86" height="32" viewBox="0 0 86 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 16H74" stroke="#1FA971" strokeWidth="2" strokeLinecap="round" />
      <path d="M66 8L74 16L66 24" stroke="#1FA971" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </div>
);

function OnboardingFlow() {
  return (
    <div className="onboarding-flow">
      <div className="onboarding-topbar">
        <div className="badge-pill">HostelMate</div>
        <h1 className="onboarding-title">HostelMate Smart Hostel Management System</h1>
        <p className="onboarding-subtitle">
          Premium mobile-first onboarding for Indian hostel owners with glassmorphism, emerald gradients, and luxury SaaS polish.
        </p>
      </div>

      <div className="onboarding-carousel">
        <section className="onboarding-screen">
          <div className="mobile-frame">
            <div className="mobile-notch" />
            <div className="screen-inner">
              <div className="card card-top-gradient" style={{ background: screenGradient }}>
                <div className="top-pill">Welcome</div>
                <h2>HostelMate</h2>
                <p>Login to continue with your hostel dashboard</p>
              </div>
              <div className="glass-card login-panel">
                <div className="input-group">
                  <label className="input-label">Username / Phone</label>
                  <input className="input-field" placeholder="+91 98765 43210" />
                </div>
                <div className="input-group">
                  <label className="input-label">Password</label>
                  <input className="input-field" type="password" placeholder="Enter temporary password" />
                </div>
                <button className="btn-primary">Login</button>
                <p className="helper-text">Use temporary credentials sent via WhatsApp</p>
              </div>
            </div>
          </div>
        </section>

        <Arrow />

        <section className="onboarding-screen">
          <div className="mobile-frame">
            <div className="mobile-notch" />
            <div className="screen-inner">
              <div className="hero-card glass-card">
                <span className="hero-chip">Welcome back</span>
                <h2>Welcome Ajin Saji 👋</h2>
                <p>Welcome to HostelMate</p>
                <span className="hero-meta">Powered by BetaMIND TechSolutions</span>
                <div className="hero-illustration" />
                <button className="btn-primary">Continue</button>
              </div>
            </div>
          </div>
        </section>

        <Arrow />

        <section className="onboarding-screen">
          <div className="mobile-frame">
            <div className="mobile-notch" />
            <div className="screen-inner">
              <div className="glass-card security-card">
                <div className="screen-heading">
                  <div className="status-icon">🔒</div>
                  <div>
                    <h3>Security Setup</h3>
                    <p className="text-small text-muted">Protect your account with a strong password.</p>
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label">Current Password</label>
                  <input className="input-field" type="password" placeholder="Enter current password" />
                </div>
                <div className="input-group">
                  <label className="input-label">New Password</label>
                  <input className="input-field" type="password" placeholder="Create new password" />
                </div>
                <div className="input-group">
                  <label className="input-label">Confirm Password</label>
                  <input className="input-field" type="password" placeholder="Confirm new password" />
                </div>
                <div className="info-alert">
                  Please change your temporary password before continuing.
                </div>
                <button className="btn-primary">Save & Continue</button>
              </div>
            </div>
          </div>
        </section>

        <Arrow />

        <section className="onboarding-screen">
          <div className="mobile-frame">
            <div className="mobile-notch" />
            <div className="screen-inner">
              <div className="glass-card rules-card">
                <h3>Setup Hostel Rules</h3>
                <p className="text-small text-muted">Create a welcoming culture with clear house rules.</p>
                <textarea className="input-field" rows="4" placeholder="Share the most important rules for your hostel." />
                <div className="rule-chip-row">
                  <span className="rule-chip">No Smoking</span>
                  <span className="rule-chip">Visitors before 9 PM</span>
                  <span className="rule-chip">Rent before 5th</span>
                  <span className="rule-chip">No Loud Music</span>
                </div>
                <div className="illustration-line" />
                <button className="btn-primary">Save & Continue</button>
              </div>
            </div>
          </div>
        </section>

        <Arrow />

        <section className="onboarding-screen">
          <div className="mobile-frame">
            <div className="mobile-notch" />
            <div className="screen-inner">
              <div className="glass-card rooms-card">
                <div className="screen-heading">
                  <div className="status-icon">🏨</div>
                  <div>
                    <h3>Add Rooms & Beds</h3>
                    <p className="text-small text-muted">Fill key hostel details and preview room setup.</p>
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label">Room Number</label>
                  <input className="input-field" placeholder="101" />
                </div>
                <div className="input-group">
                  <label className="input-label">Room Type</label>
                  <select className="input-field">
                    <option>Standard Deluxe</option>
                    <option>AC Suite</option>
                    <option>Shared Dorm</option>
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Total Beds</label>
                  <input className="input-field" placeholder="4" />
                </div>
                <button className="btn-secondary">Add Room</button>
                <div className="room-preview-row">
                  <div className="room-preview-card">
                    <span>Room 101</span>
                    <strong>4 Beds</strong>
                  </div>
                  <div className="room-preview-card">
                    <span>Room 102</span>
                    <strong>2 Beds</strong>
                  </div>
                </div>
                <div className="action-row">
                  <button className="btn-secondary">Skip For Now</button>
                  <button className="btn-primary">Save & Finish</button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <Arrow />

        <section className="onboarding-screen onboarding-success-screen">
          <div className="mobile-frame">
            <div className="mobile-notch" />
            <div className="screen-inner">
              <div className="glass-card success-card">
                <div className="success-badge">Setup Complete 🎉</div>
                <h2>Happy Business Journey with HostelMate</h2>
                <p>Your hostel is now ready to manage residents, rooms, rent and food.</p>
                <div className="success-illustration" />
                <button className="btn-primary">Go To Dashboard</button>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="onboarding-progress">
        {[
          "Login",
          "Welcome",
          "Password",
          "Rules",
          "Rooms",
          "Dashboard",
        ].map((step, index) => (
          <div className="progress-step" key={step}>
            <span className={`progress-dot ${index === 0 ? "active" : ""}`} />
            <span>{step}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default OnboardingFlow;
