import { useState } from "react";
import { X, User, Mail, Phone, Lock, Briefcase, DollarSign, Calendar, Image as ImageIcon } from "lucide-react";

export default function AddStaffModal({ isOpen, onClose, onSubmit, initialData = null }) {
  const [form, setForm] = useState(
    initialData || {
      fullName: "",
      email: "",
      phone: "",
      role: "Warden",
      designation: "Warden",
      salary: "",
      joiningDate: new Date().toISOString().slice(0, 10),
      photo: "",
      password: "",
      confirmPassword: "",
    }
  );
  const [error, setError] = useState("");

  const handleChange = (key, value) => {
    setForm((prev) => {
      const updated = { ...prev, [key]: value };
      if (key === "role") {
        if (value === "Warden") updated.designation = "Warden";
        else if (value === "Cook") updated.designation = "Head Cook";
        else if (value === "Accountant") updated.designation = "Accountant";
      }
      return updated;
    });
    setError("");
  };

  const handleSubmit = async () => {
    if (!form.fullName.trim()) {
      setError("Full name is required");
      return;
    }
    if (!form.email.trim()) {
      setError("Email address is required");
      return;
    }
    if (!form.phone.trim()) {
      setError("Phone number is required");
      return;
    }
    if (!initialData) {
      if (!form.password) {
        setError("Password is required");
        return;
      }
      if (form.password !== form.confirmPassword) {
        setError("Passwords do not match");
        return;
      }
    }

    await onSubmit(form);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-2xl my-8 bg-slate-900/95 border border-slate-700/60 rounded-3xl p-6 shadow-2xl text-slate-100">
        <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-bold">{initialData ? "Edit Staff Member" : "Add New Staff Member"}</h2>
            <p className="text-xs text-slate-400">
              {initialData ? "Update staff member profile & employment details" : "Create a new Warden, Cook, or Accountant"}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5 mb-1">
              <User size={14} className="text-emerald-400" /> Full Name *
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
              placeholder="e.g. Rahul Sharma"
              value={form.fullName}
              onChange={(e) => handleChange("fullName", e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5 mb-1">
              <Mail size={14} className="text-emerald-400" /> Email Address *
            </label>
            <input
              type="email"
              className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
              placeholder="rahul@example.com"
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5 mb-1">
              <Phone size={14} className="text-emerald-400" /> Phone Number *
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
              placeholder="+91 9876543210"
              value={form.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5 mb-1">
              <Briefcase size={14} className="text-emerald-400" /> Role *
            </label>
            <select
              className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
              value={form.role}
              onChange={(e) => handleChange("role", e.target.value)}
            >
              <option value="Warden">Warden</option>
              <option value="Cook">Cook</option>
              <option value="Accountant">Accountant</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5 mb-1">
              <Briefcase size={14} className="text-emerald-400" /> Designation
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
              placeholder="e.g. Senior Warden"
              value={form.designation}
              onChange={(e) => handleChange("designation", e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5 mb-1">
              <DollarSign size={14} className="text-emerald-400" /> Salary (₹ / month)
            </label>
            <input
              type="number"
              className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
              placeholder="25000"
              value={form.salary}
              onChange={(e) => handleChange("salary", e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5 mb-1">
              <Calendar size={14} className="text-emerald-400" /> Joining Date
            </label>
            <input
              type="date"
              className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
              value={form.joiningDate ? form.joiningDate.slice(0, 10) : ""}
              onChange={(e) => handleChange("joiningDate", e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5 mb-1">
              <ImageIcon size={14} className="text-emerald-400" /> Photo URL
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
              placeholder="https://..."
              value={form.photo}
              onChange={(e) => handleChange("photo", e.target.value)}
            />
          </div>

          {!initialData && (
            <>
              <div>
                <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5 mb-1">
                  <Lock size={14} className="text-emerald-400" /> Password *
                </label>
                <input
                  type="password"
                  className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                  placeholder="Min 6 characters"
                  value={form.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5 mb-1">
                  <Lock size={14} className="text-emerald-400" /> Confirm Password *
                </label>
                <input
                  type="password"
                  className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                  placeholder="Re-enter password"
                  value={form.confirmPassword}
                  onChange={(e) => handleChange("confirmPassword", e.target.value)}
                />
              </div>
            </>
          )}
        </div>

        {error && <p className="text-xs text-rose-400 mt-3">{error}</p>}

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-5 py-2 text-xs font-semibold rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition shadow-lg shadow-emerald-500/20"
          >
            {initialData ? "Save Changes" : "Create Staff Account"}
          </button>
        </div>
      </div>
    </div>
  );
}
