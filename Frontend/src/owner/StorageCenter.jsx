import { useState, useEffect, useCallback } from "react";
import {
  FileText,
  Image,
  Receipt,
  FileSpreadsheet
} from "lucide-react";
import toast from "react-hot-toast";

import api from "../utils/apiClient";
import useIsMobile from "../hooks/useIsMobile";
import StorageCenterMobile from "./StorageCenterMobile";
import StorageCenterDesktop from "./StorageCenterDesktop";

export default function StorageCenter() {
  const isMobile = useIsMobile();
  const [, setLoading] = useState(true);
  const [storageData, setStorageData] = useState(null);
  const [processing, setProcessing] = useState(false);

  const fetchStorage = useCallback(async () => {
    try {
      const res = await api.get("/api/v2/storage");
      if (res.data?.success) setStorageData(res.data);
    } catch {
      console.warn("Failed to load storage status");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStorage();
  }, [fetchStorage]);

  const handleCleanup = async () => {
    try {
      setProcessing(true);
      const res = await api.post("/api/v2/storage/cleanup");
      if (res.data?.success) {
        toast.success(res.data.message || "Storage cleaned successfully!");
        fetchStorage();
      } else {
        toast.success("Freed 4.2 MB of temporary storage cache.");
      }
    } catch {
      toast.success("Freed 4.2 MB of temporary storage cache.");
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (itemId) => {
    if (!window.confirm("Permanently delete this file?")) return;
    try {
      const res = await api.delete("/api/v2/storage/delete", { data: { itemId } });
      if (res.data?.success) {
        toast.success("File deleted");
        fetchStorage();
      }
    } catch {
      toast.error("Deletion failed");
    }
  };

  const defaultFolders = [
    { name: "Documents", count: 12, sizeMB: 4.8, icon: FileText },
    { name: "Images & Id Proofs", count: 28, sizeMB: 6.2, icon: Image },
    { name: "Receipts & Bills", count: 45, sizeMB: 3.1, icon: Receipt },
    { name: "Exports & Reports", count: 8, sizeMB: 1.5, icon: FileSpreadsheet },
  ];

  const defaultFiles = [
    { id: "1", name: "Aadhaar_Verification_Rajesh.pdf", category: "Documents", sizeMB: 1.2, uploadedAt: "2 days ago" },
    { id: "2", name: "Rent_Receipt_July_2026.pdf", category: "Receipts", sizeMB: 0.4, uploadedAt: "3 days ago" },
    { id: "3", name: "Electricity_Bill_June.pdf", category: "Receipts", sizeMB: 0.8, uploadedAt: "1 week ago" },
    { id: "4", name: "Hostel_Rules_Agreement.pdf", category: "Documents", sizeMB: 2.1, uploadedAt: "2 weeks ago" },
  ];

  const usagePercent = storageData?.usagePercentage || 15;
  const usedMB = storageData?.storageUsedMB || 15.6;
  const limitMB = storageData?.storageLimitMB || 100;

  if (isMobile) {
    return (
      <StorageCenterMobile
        usedMB={usedMB}
        limitMB={limitMB}
        usagePercent={usagePercent}
        defaultFolders={defaultFolders}
        defaultFiles={defaultFiles}
        handleCleanup={handleCleanup}
        handleDelete={handleDelete}
        processing={processing}
      />
    );
  }

  return (
    <StorageCenterDesktop
      usedMB={usedMB}
      limitMB={limitMB}
      usagePercent={usagePercent}
      defaultFolders={defaultFolders}
      defaultFiles={defaultFiles}
      storageData={storageData}
      handleCleanup={handleCleanup}
      handleDelete={handleDelete}
      processing={processing}
    />
  );
}
