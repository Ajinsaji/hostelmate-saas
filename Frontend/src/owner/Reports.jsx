import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";

import api from "../utils/apiClient";
import useIsMobile from "../hooks/useIsMobile";
import ReportsMobile from "./ReportsMobile";
import ReportsDesktop from "./ReportsDesktop";

export default function Reports() {
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(true);
  const [reportsList, setReportsList] = useState([]);
  const [selectedFormat, setSelectedFormat] = useState("PDF");
  const [emailModal, setEmailModal] = useState(null);
  const [emailInput, setEmailInput] = useState("");
  const [generating, setGenerating] = useState(false);
  const [loadError, setLoadError] = useState("");

  const fetchReports = useCallback(async () => {
    try {
      const res = await api.get("/api/v2/reports");
      if (res.data?.success) {
        setReportsList(res.data.reports || []);
      } else {
        setLoadError("Report categories could not be loaded.");
      }
    } catch (err) {
      setLoadError(err?.response?.data?.message || "Report categories are currently unavailable.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(fetchReports, 0);
    return () => clearTimeout(timer);
  }, [fetchReports]);

  const activeReports = reportsList;

  const handleGenerate = async (reportId) => {
    try {
      setGenerating(true);
      const res = await api.post("/api/v2/reports/generate", {
        reportId,
        format: selectedFormat
      });

      if (res.data?.success && res.data?.downloadUrl && !res.data.downloadUrl.includes("/api/v2/reports/download/")) {
        window.open(res.data.downloadUrl, "_blank");
        toast.success(`Report ready for download in ${selectedFormat} format!`);
      } else if (res.data?.success) {
        toast(
          res.data.message || `Report generation is currently in preview mode. Direct ${selectedFormat} file streaming will be available in an upcoming update.`,
          { icon: "ℹ️", duration: 5000 }
        );
      } else {
        toast.error(res.data?.message || `Unable to generate ${selectedFormat} report.`);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || `Failed to generate ${selectedFormat} report. Generation service is currently unavailable.`);
    } finally {
      setGenerating(false);
    }
  };

  const handleSendEmail = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!emailInput || !emailModal) return;
    try {
      setGenerating(true);
      const res = await api.post("/api/v2/reports/email", {
        reportId: emailModal.id || emailModal._id,
        recipientEmail: emailInput,
        format: selectedFormat
      });
      if (res.data?.success) {
        toast.success(res.data.message || "Report dispatch request queued!");
        setEmailModal(null);
        setEmailInput("");
      } else {
        toast.error(res.data?.message || "Failed to email report.");
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to email report. Service is currently unavailable.");
    } finally {
      setGenerating(false);
    }
  };

  if (isMobile) {
    return (
      <ReportsMobile
        activeReports={activeReports}
        loading={loading}
        loadError={loadError}
        selectedFormat={selectedFormat}
        setSelectedFormat={setSelectedFormat}
        handleGenerate={handleGenerate}
        emailModal={emailModal}
        setEmailModal={setEmailModal}
        emailInput={emailInput}
        setEmailInput={setEmailInput}
        handleSendEmail={handleSendEmail}
        generating={generating}
      />
    );
  }

  return (
    <ReportsDesktop
      activeReports={activeReports}
      loading={loading}
      loadError={loadError}
      selectedFormat={selectedFormat}
      setSelectedFormat={setSelectedFormat}
      handleGenerate={handleGenerate}
      emailModal={emailModal}
      setEmailModal={setEmailModal}
      emailInput={emailInput}
      setEmailInput={setEmailInput}
      handleSendEmail={handleSendEmail}
      generating={generating}
    />
  );
}
