import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { MapPin, Phone, Building, CheckCircle, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { PREMIUM_THEME, PageShell, GlassCard } from '../owner/PremiumUI';

export default function PublicHostel() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [hostel, setHostel] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHostel = async () => {
      try {
        const url = import.meta.env.VITE_API_URL || 'https://hostelmate-saas-1.onrender.com';
        const response = await axios.get(`${url}/api/public/hostel/${slug}`);
        if (response.data.success) {
          setHostel(response.data.data);
        } else {
          toast.error("Hostel not found");
        }
      } catch (error) {
        toast.error("Error fetching hostel details");
      } finally {
        setLoading(false);
      }
    };
    fetchHostel();
  }, [slug]);

  if (loading) {
    return <PageShell title="Loading..." subtitle="Fetching hostel details" />;
  }

  if (!hostel) {
    return (
      <PageShell title="Not Found" subtitle="This hostel does not exist">
        <GlassCard>
          <p className="text-slate-300">The requested hostel could not be found.</p>
          <button onClick={() => navigate('/')} className="mt-4 px-4 py-2 rounded-lg" style={{ background: PREMIUM_THEME.primary, color: 'white' }}>
            Go Home
          </button>
        </GlassCard>
      </PageShell>
    );
  }

  return (
    <PageShell title={hostel.hostelName} subtitle="Welcome to our hostel">
      <GlassCard className="mb-6">
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white mb-2">{hostel.hostelName}</h2>
            <div className="flex items-center gap-2 text-slate-300 mb-1">
              <MapPin size={16} />
              <span>{hostel.address || hostel.city || 'Address not provided'}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Phone size={16} />
              <span>Contact: {hostel.owner?.phone || 'N/A'}</span>
            </div>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-4">Amenities</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2 text-slate-300">
            <CheckCircle size={16} style={{ color: PREMIUM_THEME.primary }} />
            <span>24/7 Security</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <CheckCircle size={16} style={{ color: PREMIUM_THEME.primary }} />
            <span>High-Speed WiFi</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <CheckCircle size={16} style={{ color: PREMIUM_THEME.primary }} />
            <span>Clean Rooms</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <CheckCircle size={16} style={{ color: PREMIUM_THEME.primary }} />
            <span>RO Water</span>
          </div>
        </div>
      </GlassCard>

      <div className="flex justify-center mt-8">
        <button 
          onClick={() => navigate(`/hostel/${slug}/apply`)}
          className="flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-lg transition-transform hover:scale-105"
          style={{ background: PREMIUM_THEME.primary, color: 'white', boxShadow: `0 4px 20px ${PREMIUM_THEME.primary}40` }}
        >
          Apply for Admission <ArrowRight size={20} />
        </button>
      </div>
    </PageShell>
  );
}
