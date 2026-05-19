import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

const adminSupport = {
  name: "Admin Support",
  email: "support@hostelmate.com",
  phone: "+91 XXXXXXXXXX",
};

const safePhoneForTel = (phone) => {
  if (!phone) return "";
  return String(phone).replace(/\s+/g, "").replace(/x+/gi, "");
};

function PendingApproval() {
  const navigate = useNavigate();

  const pending = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("pendingApproval") || "null");
    } catch {
      return null;
    }
  }, []);

  const phoneForQuery = pending?.phone || pending?.email || "";

  const [checking, setChecking] = useState(true);
  const [rejected, setRejected] = useState(false);
  const [status, setStatus] = useState("Waiting For Approval");

  const [approved, setApproved] = useState(false);

  const contactSection = (
    <div style={{ borderTop: "1px solid rgba(0,0,0,0.08)", paddingTop: 16, marginTop: 10 }}>
      <div style={{ fontWeight: 800, marginBottom: 10 }}>Need Help? Contact Admin</div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 2 }}>Admin</div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>{adminSupport.name}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 2 }}>Email</div>
          <a
            href={`mailto:${adminSupport.email}`}
            style={{ color: "var(--primary)", fontWeight: 700, textDecoration: "none", wordBreak: "break-word" }}
          >
            {adminSupport.email}
          </a>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 2 }}>Phone</div>
          <a
            href={`tel:${safePhoneForTel(adminSupport.phone)}`}
            style={{ color: "var(--primary)", fontWeight: 700, textDecoration: "none" }}
          >
            {adminSupport.phone}
          </a>
        </div>
      </div>
    </div>
  );

  const checkStatus = async () => {
    if (!pending) {
      setStatus("No pending request found");
      setRejected(false);
      setApproved(false);
      return;
    }


    if (!phoneForQuery) {
      setStatus("Waiting For Approval");
      setRejected(false);
      setApproved(false);
      return;
    }

    setChecking(true);
    try {
      const queryPhone = pending.phone || pending.email;
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/request/status/${encodeURIComponent(queryPhone)}`
      );

      console.log("Polling response:", res.data);
      const data = res.data || {};
      const requestStatus =
        data?.request?.status || data?.status || "";
      const normalizedStatus = String(requestStatus).toLowerCase();
      const isApproved = normalizedStatus === "approved" || data?.approved === true;
      const isRejected = normalizedStatus === "rejected" || data?.rejected === true;

      if (data?.message === "No application found" || data?.message === "Request not found") {
        localStorage.removeItem("pendingRequestId");
        localStorage.removeItem("pendingPhone");
        localStorage.removeItem("pendingApproval");
        navigate("/register");
        return;
      }

      setApproved(isApproved);
      setRejected(isRejected);
      setStatus(requestStatus || "Waiting For Approval");

      if (isApproved) {
        localStorage.removeItem("pendingApproval");
        localStorage.removeItem("pendingRequestId");
        localStorage.removeItem("pendingPhone");
        toast.success("Your hostel has been approved. Please login.");
        navigate("/login");
      }
    } catch (error) {
      console.log("Polling response error:", error?.response?.data || error?.message || error);
      if (error?.response?.status === 404 && error?.response?.data?.message) {
        localStorage.removeItem("pendingRequestId");
        localStorage.removeItem("pendingPhone");
        localStorage.removeItem("pendingApproval");
        navigate("/register");
        return;
      }

      setRejected(false);
      setApproved(false);
      setStatus("Waiting For Approval");
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    let intervalId;

    const run = async () => {
      if (cancelled) return;
      await checkStatus();
    };

    run();
    intervalId = setInterval(() => {
      if (!cancelled) {
        checkStatus();
      }
    }, 5000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending]);


  const refreshStatus = async () => {
    await checkStatus();
  };

  const shouldShowWaiting = pending && !approved;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <div
        className="gradient-header"
        style={{ paddingBottom: "100px", borderBottomLeftRadius: "40px", borderBottomRightRadius: "40px" }}
      >
        <button
          className="btn-icon"
          style={{ background: "rgba(255,255,255,0.2)", color: "white", marginBottom: "24px" }}
          onClick={() => navigate("/")}
        >
          <CheckCircle2 size={24} style={{ transform: "rotate(0deg)" }} />
        </button>

        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>
          Request Already Submitted
        </h1>
        <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 16 }}>
          Our admin team is reviewing your application.
        </p>

      </div>

      <div className="p-4" style={{ marginTop: "-60px", paddingBottom: "80px" }}>
        <div
          className="glass-card animate-slide-up"
          style={{ background: "var(--surface)", boxShadow: "var(--shadow-md)", padding: "24px" }}
        >
          <div style={{ maxWidth: 720, margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 9999,
                  background: "rgba(16, 185, 129, 0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <CheckCircle2 size={22} color="var(--success, #10b981)" />
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: "var(--text)" }}>
                Request Already Submitted
              </h2>

            </div>

            <p style={{ color: "var(--text-body)", fontSize: 15, lineHeight: 1.6, margin: "0 0 10px" }}>
              You have already submitted your hostel registration request.
            </p>
            <p style={{ color: "var(--text-body)", fontSize: 15, lineHeight: 1.6, margin: "0 0 18px" }}>
              Our admin team is reviewing your application.
              <br />
              You will be able to login only after admin approval.
            </p>

            <p style={{ color: "var(--text-body)", fontSize: 15, lineHeight: 1.6, margin: "0 0 18px" }}>
              Expected response time: Within 3 hours.
            </p>


            <div style={{ padding: 14, borderRadius: 14, background: "rgba(16,185,129,0.08)" }}>
              <div style={{ fontWeight: 900, marginBottom: 6 }}>Status</div>
              <div style={{ fontWeight: 800 }}>
                {checking ? "Checking..." : status}
              </div>

```js
qrCodeUrl: qrResult.url
```

Also ensure:

```js
publicUrl: publicUrl
```

remains unchanged.

========================================
2. VERIFY qrCodeService.js
==========================

File:

* Backend/utils/qrCodeService.js

Ensure generateQRCode() returns:

```js
{
  success: true,
  url: uploadedCloudinaryUrl
}
```

NOT local filenames only.

If QR image is generated locally first:

* upload generated QR image to Cloudinary
* return secure_url

Example:

```js
const result = await cloudinary.uploader.upload(tempFilePath, {
   folder: "hostelmate/qrcodes"
});

return {
   success: true,
   url: result.secure_url
};
```

========================================
3. FIX OWNER PROFILE PHOTO STORAGE
==================================

Problem:
Owner photo uploads exist but admin UI shows:
NO AVATAR

Fix:
Store Cloudinary secure_url in:

* HostelRequest
* Owner
* Hostel

In requestController.js:
save:

```js
ownerPhoto: uploadedCloudinaryUrl
```

In approveHostel():

```js
await Owner.create({
   ...
   profileImage: request.ownerPhoto || "",
});
```

OR:

```js
ownerPhoto: request.ownerPhoto
```

depending on Owner schema.

========================================
4. FIX REGISTER PAGE FIELD PERSISTENCE
======================================

File:

* Frontend/src/components/RegisterPage.jsx

Ensure FormData sends:

```js
formData.append("hostelType", hostelType);
formData.append("district", district);
formData.append("city", city);
formData.append("pincode", pincode);
formData.append("state", state);
```

Also ensure:

```js
formData.append("ownerPhoto", ownerPhotoFile);
```

========================================
5. FIX requestController.js
===========================

When saving HostelRequest:

```js
hostelType: req.body.hostelType || "",
district: req.body.district || "",
city: req.body.city || "",
pincode: req.body.pincode || "",
state: req.body.state || "",
```

Also save:

```js
ownerPhoto
```

using uploaded Cloudinary URL.

========================================
6. FIX approveHostel()
======================

Inside Hostel.create():

Add:

```js
hostelType: request.hostelType || "",
district: request.district || "",
city: request.city || "",
pincode: request.pincode || "",
state: request.state || "",
```

Inside Owner.create():

Add:

```js
profileImage: request.ownerPhoto || "",
```

========================================
7. FIX Hostel MODEL
===================

File:

* Backend/models/Hostel.js

Ensure schema contains:

```js
hostelType: {
   type: String,
   default: ""
},

district: {
   type: String,
   default: ""
},

city: {
   type: String,
   default: ""
},

pincode: {
   type: String,
   default: ""
},

qrCodeUrl: {
   type: String,
   default: ""
},
```

========================================
8. FIX ADMIN UI FIELD MAPPING
=============================

File:

* Frontend/src/Superadmin/HostelManagement.jsx

Fix:

Created date:

```js
new Date(hostel.createdAt).toLocaleDateString()
```

NOT:

```js
hostel.created
```

Profile image:

```jsx
<img src={hostel.owner?.profileImage} />
```

QR image:

```jsx
<img src={hostel.qrCodeUrl} />
```

Add fallback:

```jsx
onError={(e) => {
   e.target.src = "/default-avatar.png";
}}
```

========================================
9. IMPORTANT
============

OLD HOSTELS created before fixes may still show:

* N/A
* broken QR
* missing avatar

Only NEW registrations after fixes should fully work.

Do NOT manually edit old broken records unless needed.

========================================
10. FINAL VERIFICATION
======================

After fixes:

1. Register NEW hostel
2. Approve from admin
3. Verify MongoDB Hostel document contains:

```json
{
  "hostelType": "Boys",
  "district": "Thrissur",
  "city": "Mannuthy",
  "pincode": "680651",
  "qrCodeUrl": "https://res.cloudinary.com/...",
  "profileImage": "https://res.cloudinary.com/..."
}
```

4. Verify admin page shows:

* avatar
* QR image
* district
* city
* pincode
* type
* created date

5. Verify View QR and Download QR work correctly.

Apply only minimal diffs.
Do NOT corrupt adminController.js again.

              </div>

              {rejected && (
                <div style={{ marginTop: 8, color: "var(--text-body)" }}>
                  Your registration request was rejected. Please contact admin support.
                </div>
              )}
            </div>

            {contactSection}

            {pending && !approved && (
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 18 }}>
                <button className="btn-primary" onClick={refreshStatus} disabled={checking}>
                  {checking ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Refresh Status
                    </>
                  ) : (
                    "Refresh Status"
                  )}
                </button>

                <button
                  onClick={async () => {
                    try {
                      const requestId = localStorage.getItem("pendingRequestId");
                      if (!requestId) {
                        toast.error("No request id found");
                        return;
                      }
                      const response = await axios.delete(
                        `${import.meta.env.VITE_API_URL}/api/request/cancel/${requestId}`
                      );
                      if (response.data.success) {
                        localStorage.removeItem("pendingRequestId");
                        localStorage.removeItem("pendingPhone");
                        localStorage.removeItem("pendingApproval");
                        toast.success("Request cancelled");
                        navigate("/register");
                      } else {
                        toast.error(response.data.message || "Failed to cancel request");
                      }
                    } catch (error) {
                      console.error("Cancel Request Error:", error);
                      toast.error("Failed to cancel request");
                    }
                  }}
                  className="bg-red-500 text-white px-4 py-2 rounded"
                >
                  Cancel Request
                </button>

                <button
                  className="btn-secondary"
                  onClick={() => {
                    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
                  }}
                >
                  Contact Admin
                </button>
              </div>
            )}

            {(!pending || approved) && (
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 18 }}>
                <button className="btn-primary" onClick={refreshStatus} disabled={checking}>
                  {checking ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Refresh Status
                    </>
                  ) : (
                    "Refresh Status"
                  )}
                </button>

                <button
                  className="btn-secondary"
                  onClick={() => {
                    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
                  }}
                >
                  Contact Admin
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

export default PendingApproval;

