import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { PREMIUM_THEME, PageShell, GlassCard } from '../owner/PremiumUI';
import { Upload, CheckCircle } from 'lucide-react';

export default function PublicHostelRegister() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    dob: '',
    gender: 'Male',
    aadhaarNumber: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    address: ''
  });
  
  const [files, setFiles] = useState({
    photoFile: null,
    idProofFile: null,
    signatureFile: null
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const handleFileChange = (e) => {
    setFiles({ ...files, [e.target.name]: e.target.files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => data.append(key, formData[key]));
      if (files.photoFile) data.append('photoFile', files.photoFile);
      if (files.idProofFile) data.append('idProofFile', files.idProofFile);
      if (files.signatureFile) data.append('signatureFile', files.signatureFile);
      
      const url = import.meta.env.VITE_API_URL || 'https://hostelmate-saas-1.onrender.com';
      const response = await axios.post(`${url}/api/public/hostel/${slug}/admission`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (response.data.success) {
        setSuccess(true);
        toast.success("Application submitted successfully!");
      } else {
        toast.error(response.data.message || "Submission failed");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <PageShell title="Success" subtitle="Application Received">
        <GlassCard className="text-center py-10">
          <div className="flex justify-center mb-4">
            <CheckCircle size={64} style={{ color: PREMIUM_THEME.primary }} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Application Submitted!</h2>
          <p className="text-slate-300 mb-6">Your admission request has been sent to the hostel administration. You will be contacted shortly.</p>
          <button onClick={() => navigate(`/hostel/${slug}`)} className="px-6 py-3 rounded-xl font-bold" style={{ background: PREMIUM_THEME.primary, color: 'white' }}>
            Back to Hostel
          </button>
        </GlassCard>
      </PageShell>
    );
  }

  return (
    <PageShell title="Admission Form" subtitle="Apply for accommodation">
      <GlassCard>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-300 mb-1">Full Name</label>
              <input type="text" name="name" required onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white" />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Phone Number</label>
              <input type="tel" name="phone" required onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white" />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Email</label>
              <input type="email" name="email" required onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white" />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Date of Birth</label>
              <input type="date" name="dob" required onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white" />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div>
              <label className="block text-sm text-slate-300 mb-1">Photo</label>
              <input type="file" name="photoFile" onChange={handleFileChange} className="w-full text-slate-300 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-slate-800 file:text-white" />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">ID Proof</label>
              <input type="file" name="idProofFile" onChange={handleFileChange} className="w-full text-slate-300 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-slate-800 file:text-white" />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Signature</label>
              <input type="file" name="signatureFile" onChange={handleFileChange} className="w-full text-slate-300 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-slate-800 file:text-white" />
            </div>
          </div>
          
          <div className="pt-6">
            <button type="submit" disabled={loading} className="w-full py-4 rounded-xl font-bold text-lg" style={{ background: PREMIUM_THEME.primary, color: 'white', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </form>
      </GlassCard>
    </PageShell>
  );
}
