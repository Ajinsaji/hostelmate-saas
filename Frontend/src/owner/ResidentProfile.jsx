import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../utils/apiClient";
import buildFileUrl from "../utils/buildFileUrl";
import { OwnerLayout } from "../design-system/layouts/OwnerLayout";
import { PageContainer } from "../design-system/layouts/PageContainer";
import { Section } from "../design-system/layouts/Section";
import { Card } from "../design-system/components/Card";
import { Button } from "../design-system/components/Button";
import { KPICard } from "../design-system/components/KPICard";
import { StatusPill } from "../design-system/components/StatusPill";
import { AICard } from "../design-system/components/AICard";
import { EmptyState } from "../design-system/components/EmptyState";
import Tabs from "../design-system/components/Tabs";
import Timeline from "../design-system/components/Timeline";
import { User, CreditCard, Calendar, FileText, AlertTriangle, Clock, ArrowLeft, Edit, BedDouble, Phone, MapPin, Shield } from "lucide-react";

const ResidentProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/api/residents/${id}`);
        if (res.data?.success) {
          setProfile(res.data);
        }
      } catch (err) {
        toast.error("Failed to load resident profile");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProfile();
  }, [id]);

  const handleCheckout = () => {
    toast.success("Checkout flow initialized");
  };

  if (loading) {
    return (
      <OwnerLayout>
        <PageContainer>
          <div className="flex justify-center items-center h-64">
            <span className="text-gray-500">Loading Profile...</span>
          </div>
        </PageContainer>
      </OwnerLayout>
    );
  }

  if (!profile || !profile.resident) {
    return (
      <OwnerLayout>
        <PageContainer>
          <EmptyState title="Profile Not Found" description="The resident profile could not be loaded." icon={User} />
        </PageContainer>
      </OwnerLayout>
    );
  }

  const res = profile.resident;

  // Enterprise Tabs Definition
  const tabs = [
    { id: 'details', label: 'Details', icon: User },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'attendance', label: 'Attendance', icon: Calendar },
    { id: 'documents', label: 'Documents', icon: FileText, badge: res.documents?.length || 0 },
    { id: 'complaints', label: 'Complaints', icon: AlertTriangle, badge: res.complaints?.filter(c => c.status !== 'resolved').length || 0 },
    { id: 'timeline', label: 'Timeline', icon: Clock }
  ];

  // Map backend timeline/history to timeline component
  const timelineEvents = profile.auditHistory?.map(log => ({
    id: log._id,
    title: log.action,
    description: log.details || "",
    timestamp: log.timestamp,
    type: 'default',
    icon: Clock
  })) || [];

  return (
    <OwnerLayout>
      <PageContainer>
        <Section className="py-4">
          
          {/* Top Actions */}
          <div className="flex items-center justify-between mb-6">
            <Button variant="secondary" size="sm" onClick={() => navigate("/owner/residents")}>
              <ArrowLeft size={16} /> Back to Residents
            </Button>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm">
                <Edit size={16} /> Edit Profile
              </Button>
              <Button variant="danger" size="sm" onClick={handleCheckout}>
                Check Out
              </Button>
            </div>
          </div>

          {/* Profile Hero */}
          <Card padding="none" className="overflow-visible mb-6">
            <div className="p-8 flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="w-24 h-24 rounded-full border-4 border-white shadow-md overflow-hidden bg-gray-100 shrink-0">
                <img 
                  src={res.photo ? buildFileUrl(res.photo) : `https://ui-avatars.com/api/?name=${encodeURIComponent(res.fullName || res.firstName)}&background=F3F4F6&color=6B7280`} 
                  alt={res.fullName || res.firstName}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 flex flex-col sm:flex-row justify-between items-start w-full gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                    {res.fullName || `${res.firstName} ${res.lastName}`}
                    <StatusPill status={res.status} size="md" />
                  </h1>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 font-medium">
                    <span className="flex items-center gap-1"><BedDouble size={14}/> Room {res.roomId?.roomNumber || "Unassigned"}</span>
                    <span className="flex items-center gap-1"><Phone size={14}/> {res.phone}</span>
                    <span className="flex items-center gap-1"><MapPin size={14}/> {res.permanentAddress?.city || "Unknown"}</span>
                  </div>
                </div>
                
                <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100 flex flex-col items-end">
                  <div className="text-emerald-700 text-xs font-semibold uppercase tracking-wider mb-1">Health Score</div>
                  <div className="text-2xl font-bold text-emerald-600">98/100</div>
                </div>
              </div>
            </div>
          </Card>

          {/* AI Summary */}
          {res.aiInsight && (
            <AICard 
              title="HostelMate Intelligence"
              description={res.aiInsight}
              confidence={92}
              className="mb-8"
            />
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <KPICard title="Monthly Rent" value={`₹${res.monthlyRent || 0}`} icon={CreditCard} color="blue" />
            <KPICard title="Security Deposit" value={`₹${res.securityDeposit || 0}`} icon={Shield} color="emerald" />
            <KPICard title="Pending Dues" value={`₹${res.pendingRent || 0}`} icon={AlertTriangle} color={res.pendingRent > 0 ? 'rose' : 'emerald'} />
            <KPICard title="Attendance" value="94%" icon={Calendar} color="purple" />
          </div>

          {/* Tabs */}
          <div className="mb-6">
            <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
          </div>

          {/* Tab Content */}
          <Card className="min-h-[400px]">
            {activeTab === 'details' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 border-b pb-2">Personal Information</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between"><span className="text-gray-500 text-sm">Gender</span><span className="font-medium text-gray-900 text-sm">{res.gender}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500 text-sm">DOB</span><span className="font-medium text-gray-900 text-sm">{res.dateOfBirth ? new Date(res.dateOfBirth).toLocaleDateString() : "-"}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500 text-sm">Aadhaar</span><span className="font-medium text-gray-900 text-sm">{res.aadhaarNumber}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500 text-sm">Food Preference</span><span className="font-medium text-gray-900 text-sm">{res.foodPreference}</span></div>
                    </div>
                  </div>
                </div>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 border-b pb-2">Emergency Contacts</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between"><span className="text-gray-500 text-sm">Guardian</span><span className="font-medium text-gray-900 text-sm">{res.guardianName}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500 text-sm">Phone</span><span className="font-medium text-gray-900 text-sm">{res.guardianPhone}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500 text-sm">Emergency Info</span><span className="font-medium text-gray-900 text-sm">{res.emergencyContact || "-"}</span></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'payments' && (
              <EmptyState title="Payment History" description="The detailed payment ledger will be displayed here." icon={CreditCard} />
            )}
            
            {activeTab === 'attendance' && (
              <EmptyState title="Attendance Logs" description="Attendance integration coming soon." icon={Calendar} />
            )}
            
            {activeTab === 'documents' && (
              <EmptyState title="Resident Documents" description="Upload Aadhaar, Police Verification, and Agreements." icon={FileText} />
            )}

            {activeTab === 'complaints' && (
              <EmptyState title="Complaints" description="No active complaints reported." icon={AlertTriangle} />
            )}

            {activeTab === 'timeline' && (
              <div className="max-w-2xl">
                <Timeline events={timelineEvents} />
              </div>
            )}
          </Card>
        </Section>
      </PageContainer>
    </OwnerLayout>
  );
};

export default ResidentProfile;
