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
    const user = JSON.parse(localStorage.getItem("ownerUser") || localStorage.getItem("user") || "{}");
    if (user) {
      setOwnerData({
        ownerName: user.ownerName || "Hostel Owner",
        phone: user.phone || "N/A",
        email: user.email || "owner@hostelmate.com"
      });
    }

    const fetchHostelData = async () => {
      try {
        const response = await api.get("/api/owner/dashboard");
        if (response.data?.success && response.data.hostel) {
          setHostelData(response.data.hostel);
        }
      } catch (error) {
        console.warn("Unable to load hostel details.", error);
      }
    };
    fetchHostelData();
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