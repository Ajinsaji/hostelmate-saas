import React, { useState, useEffect } from "react";
import { api } from "../../services/api";
import PageContainer from "../layouts/PageContainer";
import SectionHeader from "../layouts/SectionHeader";
import ContentContainer from "../layouts/ContentContainer";
import SaaSTable from "../components/tables/SaaSTable";
import SearchBar from "../components/forms/SearchBar";
import FilterBar from "../components/forms/FilterBar";
import StatusBadge from "../components/feedback/StatusBadge";
import Drawer from "../components/drawers/Drawer";
import { COLORS } from "../constants/theme";

export const OnboardingRequests = React.memo(() => {
  const headers = [
    { key: "hostelName", label: "Hostel Name" },
    { key: "ownerName", label: "Owner Name" },
    { key: "phone", label: "Phone" },
    { key: "city", label: "City" },
    { key: "status", label: "Status" }
  ];

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);
  
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [assigneeId, setAssigneeId] = useState("");

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/admin/requests');
      const result = response.data;
      if (result.success) {
        setData(result.requests || []);
      } else {
        setError(result.message || 'Failed to fetch requests');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const openDrawer = (req) => {
    setSelectedRequest(req);
    setIsDrawerOpen(true);
    setRejectReason("");
    setAssigneeId("");
    setActionError(null);
  };

  const handleApprove = async () => {
    try {
      setActionLoading(true);
      setActionError(null);
      await api.post(`/api/auth/approve/${selectedRequest._id}`, selectedRequest);
      setIsDrawerOpen(false);
      fetchRequests();
    } catch (err) {
      setActionError(err.response?.data?.message || err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason) return setActionError("Please provide a rejection reason.");
    try {
      setActionLoading(true);
      setActionError(null);
      await api.post(`/api/auth/reject/${selectedRequest._id}`, { reason: rejectReason });
      setIsDrawerOpen(false);
      fetchRequests();
    } catch (err) {
      setActionError(err.response?.data?.message || err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!assigneeId) return setActionError("Please provide an Admin ID.");
    try {
      setActionLoading(true);
      setActionError(null);
      await api.post(`/api/auth/assign/${selectedRequest._id}`, { adminId: assigneeId });
      setIsDrawerOpen(false);
      fetchRequests();
    } catch (err) {
      setActionError(err.response?.data?.message || err.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <PageContainer>
      <SectionHeader 
        title="Onboarding Requests"
        subtitle="Approve or reject incoming hostel signups"
      />

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <SearchBar placeholder="Search requests..." onChange={() => {}} />
        <FilterBar 
          filters={[{ key: "status", label: "Status", options: [{ label: "Pending", value: "pending" }, { label: "Approved", value: "approved" }] }]} 
          onFilterChange={() => {}}
        />
      </div>

      <ContentContainer>
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading requests...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-400">{error}</div>
        ) : data.length === 0 ? (
          <div className="p-8 text-center text-slate-400">No Data</div>
        ) : (
          <SaaSTable 
            headers={headers} 
            data={data}
            renderRow={(row, idx) => (
              <tr 
                key={row._id || idx} 
                onClick={() => openDrawer(row)}
                className="border-b border-white/5 last:border-b-0 hover:bg-white/[0.05] transition cursor-pointer"
              >
                <td className="px-6 py-4 text-xs font-bold text-white">{row.hostelName}</td>
                <td className="px-6 py-4 text-xs text-slate-300">{row.ownerName}</td>
                <td className="px-6 py-4 text-xs text-slate-400">{row.phone}</td>
                <td className="px-6 py-4 text-xs text-slate-400">{row.city}</td>
                <td className="px-6 py-4 text-xs">
                  <StatusBadge status={row.status} />
                </td>
              </tr>
            )}
          />
        )}
      </ContentContainer>

      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Request Details"
        size="md"
      >
        {selectedRequest && (
          <div className="space-y-6 text-sm text-slate-300">
            <div>
              <h4 className="font-bold text-white mb-2 border-b border-white/10 pb-1">Owner & Company Details</h4>
              <p>Name: {selectedRequest.ownerName}</p>
              <p>Phone: {selectedRequest.phone}</p>
              <p>Email: {selectedRequest.email || 'N/A'}</p>
              <p>Company: {selectedRequest.company || 'N/A'}</p>
            </div>

            <div>
              <h4 className="font-bold text-white mb-2 border-b border-white/10 pb-1">Hostel Details</h4>
              <p>Hostel: {selectedRequest.hostelName}</p>
              <p>Address: {selectedRequest.hostelAddress || 'N/A'}, {selectedRequest.city}</p>
            </div>

            <div>
              <h4 className="font-bold text-white mb-2 border-b border-white/10 pb-1">Subscription & Payment</h4>
              <p>Plan: Pro</p>
              <p>Payment: Pending Verification</p>
            </div>

            <div>
              <h4 className="font-bold text-white mb-2 border-b border-white/10 pb-1">Documents</h4>
              <p>Aadhaar: {selectedRequest.aadhaarFile ? 'Uploaded' : 'Missing'}</p>
              <p>License: {selectedRequest.licensePhoto ? 'Uploaded' : 'Missing'}</p>
            </div>

            <div>
              <h4 className="font-bold text-white mb-2 border-b border-white/10 pb-1">Audit Timeline</h4>
              <p>Created At: {new Date(selectedRequest.createdAt).toLocaleString()}</p>
              {selectedRequest.timeline && selectedRequest.timeline.map((event, i) => (
                <p key={i} className="text-xs text-slate-400 mt-1">
                  - {event.action} by {event.by} on {new Date(event.date).toLocaleDateString()}
                </p>
              ))}
            </div>

            {actionError && (
              <div className="p-3 bg-red-900/50 text-red-400 rounded border border-red-500/50 text-sm">
                {actionError}
              </div>
            )}

            <div className="flex flex-col gap-3 mt-6 border-t border-white/10 pt-4">
              <div className="flex gap-2">
                <button 
                  onClick={handleApprove}
                  disabled={actionLoading || selectedRequest.status === 'activated'}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg disabled:opacity-50"
                >
                  {actionLoading ? "Processing..." : "Approve & Activate"}
                </button>
              </div>
              
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Rejection Reason" 
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                />
                <button 
                  onClick={handleReject}
                  disabled={actionLoading || selectedRequest.status === 'rejected'}
                  className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg disabled:opacity-50"
                >
                  Reject
                </button>
              </div>

              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Admin ID" 
                  value={assigneeId}
                  onChange={e => setAssigneeId(e.target.value)}
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                />
                <button 
                  onClick={handleAssign}
                  disabled={actionLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg disabled:opacity-50"
                >
                  Assign
                </button>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </PageContainer>
  );
});

export default OnboardingRequests;
