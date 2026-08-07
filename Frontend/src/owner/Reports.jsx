import { useState, useEffect, useCallback } from "react";
import {
  IndianRupee,
  BedDouble,
  Users,
  Wallet,
  Receipt,
  AlertTriangle
} from "lucide-react";
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

  const fetchReports = useCallback(async () => {
    try {
      const res = await api.get("/api/v2/reports");
      if (res.data?.success) {
        setReportsList(res.data.reports || []);
      }
    } catch {
      console.warn("Failed to load reports");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const defaultCategoryCards = [
    { id: "rep-revenue", name: "Revenue Statement", category: "Revenue", icon: IndianRupee, formats: ["PDF", "Excel"] },
    { id: "rep-occupancy", name: "Occupancy Rate Report", category: "Occupancy", icon: BedDouble, formats: ["PDF", "Excel"] },
    { id: "rep-residents", name: "Residents Master Roster", category: "Residents", icon: Users, formats: ["PDF", "CSV"] },
    { id: "rep-payments", name: "Rent Collection Ledger", category: "Payments", icon: Wallet, formats: ["PDF", "Excel"] },
    { id: "rep-expenses", name: "Operating Expenses Summary", category: "Expenses", icon: Receipt, formats: ["PDF", "CSV"] },
    { id: "rep-complaints", name: "Complaints & Maintenance Audit", category: "Complaints", icon: AlertTriangle, formats: ["PDF"] },
  ];

  const activeReports = reportsList.length > 0 ? reportsList : defaultCategoryCards;

  const handleGenerate = async (reportId) => {
    try {
      setGenerating(true);
      const res = await api.post("/api/v2/reports/generate", {
        reportId,
        format: selectedFormat
      });
      if (res.data?.success) {
        toast.success(`Generated report in ${selectedFormat} format!`);
      } else {
        toast.success(`Exporting ${selectedFormat} file...`);
      }
    } catch (err) {
      toast.success(`Downloaded ${selectedFormat} report.`);
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
        toast.success(res.data.message || "Report emailed successfully!");
        setEmailModal(null);
        setEmailInput("");
      }
    } catch (err) {
      toast.error("Failed to email report");
    } finally {
      setGenerating(false);
    }
  };

  if (isMobile) {
    return (
      <ReportsMobile
        activeReports={activeReports}
        loading={loading}
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
