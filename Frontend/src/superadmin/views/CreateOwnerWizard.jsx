import React, { useState } from "react";
import { api } from "../../services/api";
import PageContainer from "../layouts/PageContainer";
import SectionHeader from "../layouts/SectionHeader";
import ContentContainer from "../layouts/ContentContainer";
import { COLORS } from "../constants/theme";
import { CheckCircle2, ChevronRight, ChevronLeft } from "lucide-react";

const STEPS = [
  "Owner Details",
  "Company Details",
  "Hostel Details",
  "Subscription",
  "Documents",
  "Review",
  "Create"
];

export const CreateOwnerWizard = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    ownerName: "",
    phone: "",
    email: "",
    company: "",
    hostelName: "",
    city: "",
    address: "",
    planType: "Pro",
    amount: 0,
    aadhaarFile: null,
    licensePhoto: null
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);
      // Calls the same onboarding service via the new auth/approve route with ID 'new'
      const response = await api.post('/api/auth/approve/new', formData);
      if (response.data.success) {
        setResult(response.data);
        setCurrentStep(6); // Go to Create success step
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch(currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Owner Name</label>
              <input name="ownerName" value={formData.ownerName} onChange={handleChange} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white" />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Phone</label>
              <input name="phone" value={formData.phone} onChange={handleChange} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white" />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Email</label>
              <input name="email" type="email" value={formData.email} onChange={handleChange} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white" />
            </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Company Name</label>
              <input name="company" value={formData.company} onChange={handleChange} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white" />
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Hostel Name</label>
              <input name="hostelName" value={formData.hostelName} onChange={handleChange} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white" />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">City</label>
              <input name="city" value={formData.city} onChange={handleChange} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white" />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Address</label>
              <input name="address" value={formData.address} onChange={handleChange} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white" />
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Plan Type</label>
              <select name="planType" value={formData.planType} onChange={handleChange} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white">
                <option value="Basic">Basic</option>
                <option value="Pro">Pro</option>
                <option value="Enterprise">Enterprise</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Amount Paid</label>
              <input name="amount" type="number" value={formData.amount} onChange={handleChange} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white" />
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <p className="text-slate-400 text-sm mb-4">Upload necessary KYC documents for the owner.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-900/50 p-6 rounded-xl border border-white/5">
                <label className="block text-xs font-bold text-slate-300 mb-2">Aadhaar Document</label>
                <input type="file" onChange={(e) => setFormData(prev => ({ ...prev, aadhaarFile: e.target.files[0] }))} className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-500/10 file:text-emerald-400 hover:file:bg-emerald-500/20" />
              </div>
              <div className="bg-slate-900/50 p-6 rounded-xl border border-white/5">
                <label className="block text-xs font-bold text-slate-300 mb-2">Hostel License</label>
                <input type="file" onChange={(e) => setFormData(prev => ({ ...prev, licensePhoto: e.target.files[0] }))} className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-500/10 file:text-blue-400 hover:file:bg-blue-500/20" />
              </div>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-4 text-sm text-slate-300 bg-white/5 p-6 rounded-xl">
            <h3 className="text-white font-bold text-lg mb-4">Review Details</h3>
            <p><span className="text-slate-400">Owner:</span> {formData.ownerName} ({formData.phone})</p>
            <p><span className="text-slate-400">Hostel:</span> {formData.hostelName}, {formData.city}</p>
            <p><span className="text-slate-400">Plan:</span> {formData.planType} (₹{formData.amount})</p>
            
            {error && <div className="p-3 bg-red-900/50 text-red-400 rounded mt-4 border border-red-500/50">{error}</div>}

            <div className="mt-8 flex justify-end">
              <button 
                onClick={handleSubmit} 
                disabled={loading}
                className="bg-primary hover:bg-primary-hover text-white px-6 py-2 rounded-lg font-bold disabled:opacity-50"
                style={{ backgroundColor: COLORS.primary }}
              >
                {loading ? "Creating..." : "Confirm & Create"}
              </button>
            </div>
          </div>
        );
      case 6:
        return (
          <div className="text-center space-y-4 py-12">
            <CheckCircle2 size={64} className="text-green-500 mx-auto" />
            <h3 className="text-2xl font-bold text-white">Creation Successful!</h3>
            <p className="text-slate-400">Owner and Hostel have been activated.</p>
            {result && (
              <div className="bg-slate-800 p-6 rounded-xl inline-block text-left mt-6">
                <p><strong>Hostel ID:</strong> {result.hostelId}</p>
                <p><strong>Temp Password:</strong> <span className="font-mono text-green-400">{result.tempPassword}</span></p>
              </div>
            )}
            <div className="mt-8">
              <button onClick={() => window.location.reload()} className="text-blue-400 hover:underline">
                Create Another
              </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <PageContainer>
      <SectionHeader 
        title="Create Owner Wizard"
        subtitle="Step-by-step owner & hostel onboarding"
      />

      <ContentContainer className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8 overflow-x-auto pb-4">
          {STEPS.map((step, idx) => (
            <div key={idx} className={`flex items-center ${idx !== STEPS.length - 1 ? 'flex-1' : ''}`}>
              <div className="flex flex-col items-center">
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                    idx < currentStep ? 'bg-green-500 text-white' :
                    idx === currentStep ? 'bg-blue-600 text-white' :
                    'bg-slate-800 text-slate-400'
                  }`}
                >
                  {idx < currentStep ? <CheckCircle2 size={16} /> : idx + 1}
                </div>
                <span className={`text-xs mt-2 whitespace-nowrap ${idx === currentStep ? 'text-white' : 'text-slate-500'}`}>
                  {step}
                </span>
              </div>
              {idx !== STEPS.length - 1 && (
                <div className={`flex-1 h-1 mx-4 rounded-full ${idx < currentStep ? 'bg-green-500' : 'bg-slate-800'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 min-h-[400px]">
          {renderStepContent()}
        </div>

        {currentStep < 5 && (
          <div className="flex justify-between mt-6">
            <button
              onClick={handleBack}
              disabled={currentStep === 0}
              className="flex items-center px-4 py-2 text-slate-300 hover:text-white disabled:opacity-30 transition-colors"
            >
              <ChevronLeft size={20} className="mr-1" /> Back
            </button>
            <button
              onClick={handleNext}
              className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold transition-colors"
            >
              Next <ChevronRight size={20} className="ml-1" />
            </button>
          </div>
        )}
      </ContentContainer>
    </PageContainer>
  );
};

export default CreateOwnerWizard;
