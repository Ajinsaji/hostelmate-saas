import { useNavigate } from "react-router-dom";
import { LogOut, Edit2, Mail, Phone, Lock, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

import { api } from "../services/api";
import toast from "react-hot-toast";
import SuperadminBottomNav from "../components/SuperadminBottomNav";


function AdminPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
  });

  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState({
    old: false,
    next: false,
    confirm: false,
  });


  // Fetch admin profile
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/admin/profile");
      setProfile(response.data.admin);
      setFormData({
        fullName: response.data.admin.fullName || "",
        email: response.data.admin.email || "",
        phone: response.data.admin.phone || "",
      });
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await api.put("/api/admin/profile/update", formData);
      setProfile(response.data.admin);
      setEditMode(false);
      toast.success("Profile updated successfully!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    const currentPassword = String(passwordData.oldPassword || "").trim();
    const newPassword = String(passwordData.newPassword || "").trim();
    const confirmPassword = String(passwordData.confirmPassword || "").trim();

    // Frontend validation (skip API call if invalid)
    if (!currentPassword) {
      toast.error("Current password is required");
      return;
    }
    if (!newPassword) {
      toast.error("New password is required");
      return;
    }
    if (!confirmPassword) {
      toast.error("Confirm password is required");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.put("/api/admin/profile/change-password", {
        currentPassword,
        newPassword,
        confirmPassword,
      });

      toast.success("Password updated successfully");
      setShowPasswordModal(false);
      setPasswordData({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update password");
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    navigate("/admin/login");
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #072f1f 0%, #0b7a45 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
        }}
      >
        <Loader2 size={40} className="animate-spin" />
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #072f1f 0%, #0b7a45 100%)",
        color: "white",
        padding: "20px",
        fontFamily: "Poppins",
        paddingBottom: "110px",
      }}
    >
      <div
        style={{
          maxWidth: 720,
          margin: "0 auto",
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: 24, textAlign: "center" }}>
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: 28,
              margin: "0 auto",
              background:
                "radial-gradient(circle at top left, rgba(255,255,255,0.25), rgba(255,255,255,0.05))",
              border: "1px solid rgba(255,255,255,0.25)",
              backdropFilter: "blur(12px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
              fontWeight: 800,
              fontSize: 30,
              letterSpacing: 1,
            }}
          >
            {profile?.fullName?.substring(0, 2).toUpperCase() || "SA"}
          </div>
          <h1 style={{ color: "#ffffff", marginTop: 12, marginBottom: 4, fontSize: 24 }}>
            {profile?.fullName || "Super Admin"}
          </h1>
          <p style={{ margin: 0, opacity: 0.9 }}>
            Manage your profile and security settings
          </p>
        </div>

        {/* Profile Card */}
        <div
          style={{
            background: "rgba(7, 46, 31, 0.75)",
            borderRadius: 26,
            padding: 22,
            boxShadow: "0 10px 35px rgba(0,0,0,0.15)",
            border: "1px solid rgba(255,255,255,0.15)",
            marginBottom: 16,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ margin: 0, fontSize: 18 }}>Profile Information</h2>
            <button
              onClick={() => setEditMode(!editMode)}
              style={{
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "white",
                padding: "8px 12px",
                borderRadius: 10,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <Edit2 size={16} /> {editMode ? "Cancel" : "Edit"}
            </button>
          </div>

          {editMode ? (
            <form onSubmit={handleUpdateProfile} style={{ display: "grid", gap: 12 }}>
              <div>
                <label style={{ display: "block", marginBottom: 6, fontSize: 12, opacity: 0.8 }}>
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1px solid rgba(255,255,255,0.2)",
                    background: "rgba(255,255,255,0.05)",
                    color: "white",
                    fontFamily: "Poppins",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 6, fontSize: 12, opacity: 0.8 }}>
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1px solid rgba(255,255,255,0.2)",
                    background: "rgba(255,255,255,0.05)",
                    color: "white",
                    fontFamily: "Poppins",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 6, fontSize: 12, opacity: 0.8 }}>
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1px solid rgba(255,255,255,0.2)",
                    background: "rgba(255,255,255,0.05)",
                    color: "white",
                    fontFamily: "Poppins",
                  }}
                  placeholder="10 digit number"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  marginTop: 12,
                  width: "100%",
                  background: "linear-gradient(90deg, rgba(11,122,69,1) 0%, rgba(34,197,94,1) 100%)",
                  color: "white",
                  border: "none",
                  padding: "12px 16px",
                  borderRadius: 16,
                  cursor: "pointer",
                  fontWeight: 700,
                  opacity: isSubmitting ? 0.7 : 1,
                }}
              >
                {isSubmitting ? "Saving..." : "Save Changes"}
              </button>
            </form>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Mail size={18} />
                <div>
                  <p style={{ margin: 0, fontSize: 12, opacity: 0.7 }}>Email</p>
                  <p style={{ margin: 0 }}>{profile?.email}</p>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Phone size={18} />
                <div>
                  <p style={{ margin: 0, fontSize: 12, opacity: 0.7 }}>Phone</p>
                  <p style={{ margin: 0 }}>{profile?.phone || "Not set"}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Password Reset Button */}
        <div
          style={{
            background: "rgba(7, 46, 31, 0.75)",
            borderRadius: 26,
            padding: 22,
            boxShadow: "0 10px 35px rgba(0,0,0,0.15)",
            border: "1px solid rgba(255,255,255,0.15)",
            marginBottom: 16,
          }}
        >
          <h3 style={{ margin: "0 0 12px 0", color: "#a7f3d0" }}>Security</h3>
          <button
            onClick={() => setShowPasswordModal(true)}
            type="button"
            style={{
              marginTop: 12,
              width: "100%",
              background: "linear-gradient(90deg, rgba(11,122,69,1) 0%, rgba(34,197,94,1) 100%)",
              color: "white",
              border: "none",
              padding: "12px 16px",
              borderRadius: 16,
              cursor: "pointer",
              fontWeight: 700,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Lock size={18} /> Change Password
          </button>
        </div>

        {/* Logout Button */}
        <div
          style={{
            background: "rgba(7, 46, 31, 0.75)",
            borderRadius: 26,
            padding: 22,
            boxShadow: "0 10px 35px rgba(0,0,0,0.15)",
            border: "1px solid rgba(255,255,255,0.15)",
          }}
        >
          <h3 style={{ margin: "0 0 12px 0", color: "#fca5a5" }}>Account Actions</h3>
          <button
            type="button"
            onClick={handleLogout}
            style={{
              marginTop: 12,
              width: "100%",
              background: "rgba(239, 68, 68, 0.1)",
              color: "#fca5a5",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              padding: "12px 16px",
              borderRadius: 16,
              cursor: "pointer",
              fontWeight: 700,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <LogOut size={18} /> Logout
          </button>
        </div>

        {/* Password Change Modal */}
        {showPasswordModal && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.5)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              padding: "20px",
            }}
          >
            <div
              style={{
                background: "rgba(7, 46, 31, 0.95)",
                borderRadius: 26,
                padding: 24,
                maxWidth: 400,
                width: "100%",
                border: "1px solid rgba(255,255,255,0.15)",
              }}
            >
              <h2 style={{ margin: "0 0 16px 0", color: "#ffffff" }}>
                Change Password
              </h2>

              <form onSubmit={handleChangePassword} style={{ display: "grid", gap: 12 }}>
                <div>
                  <label style={{ display: "block", marginBottom: 6, fontSize: 12, opacity: 0.8 }}>
                    Current Password
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showPassword.old ? "text" : "password"}
                      value={passwordData.oldPassword}
                      onChange={(e) =>
                        setPasswordData({ ...passwordData, oldPassword: e.target.value })
                      }
                      style={{
                        width: "100%",
                        padding: "10px 40px 10px 12px",
                        borderRadius: 10,
                        border: "1px solid rgba(255,255,255,0.2)",
                        background: "rgba(255,255,255,0.05)",
                        color: "white",
                        fontFamily: "Poppins",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword((p) => ({ ...p, old: !p.old }))
                      }
                      style={{
                        position: "absolute",
                        right: 12,
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "transparent",
                        border: "none",
                        color: "rgba(255,255,255,0.8)",
                        cursor: "pointer",
                        padding: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      aria-label={showPassword.old ? "Hide password" : "Show password"}
                    >
                      {showPassword.old ? "🙈" : "👁️"}

                    </button>
                  </div>

                </div>

                <div>
                  <label style={{ display: "block", marginBottom: 6, fontSize: 12, opacity: 0.8 }}>
                    New Password
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showPassword.next ? "text" : "password"}
                      value={passwordData.newPassword}
                      onChange={(e) =>
                        setPasswordData({ ...passwordData, newPassword: e.target.value })
                      }
                      style={{
                        width: "100%",
                        padding: "10px 40px 10px 12px",
                        borderRadius: 10,
                        border: "1px solid rgba(255,255,255,0.2)",
                        background: "rgba(255,255,255,0.05)",
                        color: "white",
                        fontFamily: "Poppins",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword((p) => ({ ...p, next: !p.next }))
                      }
                      style={{
                        position: "absolute",
                        right: 12,
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "transparent",
                        border: "none",
                        color: "rgba(255,255,255,0.8)",
                        cursor: "pointer",
                        padding: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      aria-label={showPassword.next ? "Hide password" : "Show password"}
                    >
                      {showPassword.next ? "🙈" : "👁️"}

                    </button>
                  </div>

                </div>

                <div>
                  <label style={{ display: "block", marginBottom: 6, fontSize: 12, opacity: 0.8 }}>
                    Confirm Password
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showPassword.confirm ? "text" : "password"}
                      value={passwordData.confirmPassword}
                      onChange={(e) =>
                        setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                      }
                      style={{
                        width: "100%",
                        padding: "10px 40px 10px 12px",
                        borderRadius: 10,
                        border: "1px solid rgba(255,255,255,0.2)",
                        background: "rgba(255,255,255,0.05)",
                        color: "white",
                        fontFamily: "Poppins",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword((p) => ({ ...p, confirm: !p.confirm }))
                      }
                      style={{
                        position: "absolute",
                        right: 12,
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "transparent",
                        border: "none",
                        color: "rgba(255,255,255,0.8)",
                        cursor: "pointer",
                        padding: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      aria-label={showPassword.confirm ? "Hide password" : "Show password"}
                    >
                      {showPassword.confirm ? (
                        "🙈"
                      ) : (
                        "👁️"
                      )}

                    </button>
                  </div>

                </div>

                <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    style={{
                      flex: 1,
                      padding: "10px 16px",
                      borderRadius: 12,
                      border: "1px solid rgba(255,255,255,0.2)",
                      background: "rgba(255,255,255,0.05)",
                      color: "white",
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    style={{
                      flex: 1,
                      padding: "10px 16px",
                      borderRadius: 12,
                      background: "linear-gradient(90deg, rgba(11,122,69,1) 0%, rgba(34,197,94,1) 100%)",
                      color: "white",
                      border: "none",
                      cursor: "pointer",
                      fontWeight: 600,
                      opacity: isSubmitting ? 0.7 : 1,
                    }}
                  >
                    {isSubmitting ? "Updating..." : "Update"}
                  </button>

                </div>
              </form>
            </div>
          </div>
        )}
      </div>
      <SuperadminBottomNav />
    </div>
  );
}

export default AdminPage;
