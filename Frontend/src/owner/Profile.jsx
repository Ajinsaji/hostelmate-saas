import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { api } from "../services/api";
import { clearOwnerAuth } from "../utils/authToken";
import buildQrUrl from "../utils/buildQrUrl";
import useIsMobile from "../hooks/useIsMobile";
import ProfileMobile from "./ProfileMobile";
import ProfileDesktop from "./ProfileDesktop";

export default function Profile() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [ownerData, setOwnerData] = useState({ ownerName: "", phone: "", email: "" });
  const [hostelData, setHostelData] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(true);

  useEffect(() => {
    const loadOwnerUser = () => {
      const user = JSON.parse(localStorage.getItem("ownerUser") || localStorage.getItem("user") || "{}");
      if (user) {
        setOwnerData({
          ownerName: user.ownerName || user.name || "Hostel Owner",
          phone: user.phone || "N/A",
          email: user.email || "owner@hostelmate.com",
          profileImage: user.profileImage || "",
        });
      }
    };

    loadOwnerUser();

    const fetchHostelData = async () => {
      try {
        const response = await api.get("/api/owner/dashboard");
        if (response.data?.success) {
          if (response.data.hostel) {
            setHostelData(response.data.hostel);
          }
          if (response.data.owner) {
            const o = response.data.owner;
            setOwnerData({
              ownerName: o.ownerName || "Hostel Owner",
              phone: o.phone || "N/A",
              email: o.email || "owner@hostelmate.com",
              profileImage: o.profileImage || "",
            });
          }
        }
      } catch (error) {
        console.warn("Unable to load hostel details.", error);
      }
    };
    fetchHostelData();

    window.addEventListener("profileUpdated", loadOwnerUser);
    return () => {
      window.removeEventListener("profileUpdated", loadOwnerUser);
    };
  }, []);

  const handleLogout = () => {
    clearOwnerAuth();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  if (isMobile) {
    return (
      <ProfileMobile
        ownerData={ownerData}
        hostelData={hostelData}
        showQRModal={showQRModal}
        setShowQRModal={setShowQRModal}
        handleLogout={handleLogout}
        handleCopy={handleCopy}
        navigate={navigate}
        buildQrUrl={buildQrUrl}
      />
    );
  }

  return (
    <ProfileDesktop
      ownerData={ownerData}
      hostelData={hostelData}
      showQRModal={showQRModal}
      setShowQRModal={setShowQRModal}
      pushEnabled={pushEnabled}
      setPushEnabled={setPushEnabled}
      handleLogout={handleLogout}
      handleCopy={handleCopy}
      navigate={navigate}
      buildQrUrl={buildQrUrl}
    />
  );
}