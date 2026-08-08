require('dotenv').config();
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const http = require('http');

async function runFullAcceptanceTest() {
  await mongoose.connect(process.env.MONGO_URI);
  const Admin = require('../models/Admin');
  const HostelRequest = require('../models/HostelRequest');
  const Hostel = require('../models/Hostel');
  const Owner = require('../models/Owner');
  const Subscription = require('../models/Subscription');

  const superadmin = await Admin.findOne({ role: 'super_admin' });
  if (!superadmin) {
    console.error('Superadmin user not found in DB!');
    process.exit(1);
  }
  console.log('Superadmin user found:', superadmin.username, superadmin.role);

  const superToken = jwt.sign(
    { userId: String(superadmin._id), role: superadmin.role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  const testPhone = `988${Math.floor(1000000 + Math.random() * 9000000)}`;
  const testPhoneReject = `977${Math.floor(1000000 + Math.random() * 9000000)}`;
  const testPhoneAssign = `966${Math.floor(1000000 + Math.random() * 9000000)}`;

  // Clean up existing test phone records
  await HostelRequest.deleteMany({ phone: { $in: [testPhone, testPhoneReject, testPhoneAssign] } });
  await Hostel.deleteMany({ phone: { $in: [testPhone, testPhoneReject, testPhoneAssign] } });
  await Owner.deleteMany({ phone: { $in: [testPhone, testPhoneReject, testPhoneAssign] } });

  const app = require('../server');

  setTimeout(async () => {
    const port = process.env.PORT || 5000;
    console.log('\n==================================================');
    console.log('🚀 HOSTELMATE ENTERPRISE REAL-WORLD ACCEPTANCE TEST');
    console.log('==================================================\n');

    function makeRequest(path, method = 'GET', headers = {}, body = null) {
      return new Promise((resolve, reject) => {
        const req = http.request({
          hostname: 'localhost',
          port: port,
          path: path,
          method: method,
          headers: {
            'Content-Type': 'application/json',
            ...headers
          }
        }, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            try {
              resolve({ status: res.statusCode, data: JSON.parse(data) });
            } catch (e) {
              resolve({ status: res.statusCode, text: data });
            }
          });
        });
        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
      });
    }

    try {
      // --------------------------------------------------
      // TEST 1 — FRESH REGISTRATION
      // --------------------------------------------------
      console.log('--- TEST 1: Fresh Registration ---');
      const reqDoc1 = await HostelRequest.create({
        hostelName: 'Orion Heights Co-Living',
        ownerName: 'Rahul Verma',
        phone: testPhone,
        email: `rahul.${testPhone}@example.com`,
        ownerAddress: 'Suite 401, Tech Park Road',
        hostelAddress: '789 Silicon Valley Promenade',
        state: 'Karnataka',
        district: 'Bangalore',
        city: 'Bangalore',
        pincode: '560103',
        hostelType: 'Co-living',
        aadhaarFile: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500',
        ownerPhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500',
        licensePhoto: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=500',
        status: 'pending',
        timeline: [{ action: 'Submitted Registration', date: new Date(), by: 'Owner' }]
      });

      console.log('Status:', reqDoc1.status);
      const hostelBeforeApprove = await Hostel.findOne({ phone: testPhone });
      const ownerBeforeApprove = await Owner.findOne({ phone: testPhone });
      console.log('Hostel exists before approve?:', hostelBeforeApprove !== null);
      console.log('Owner exists before approve?:', ownerBeforeApprove !== null);
      if (reqDoc1.status !== 'pending' || hostelBeforeApprove !== null || ownerBeforeApprove !== null) {
        throw new Error('TEST 1 FAILED');
      }
      console.log('TEST 1 RESULT: PASS\n');

      // --------------------------------------------------
      // TEST 2 & 3 — SUPERADMIN WORK QUEUE & DETAILS
      // --------------------------------------------------
      console.log('--- TEST 2 & 3: Superadmin Work Queue & Details ---');
      const r2 = await makeRequest('/api/admin/requests', 'GET', {
        'Authorization': `Bearer ${superToken}`
      });
      const foundInQueue = r2.data?.requests?.find(r => r._id === String(reqDoc1._id));
      console.log('Found in Work Queue?:', !!foundInQueue);
      console.log('Details Check - Owner Name:', foundInQueue?.ownerName, 'Hostel Name:', foundInQueue?.hostelName);
      if (!foundInQueue || foundInQueue.ownerName !== 'Rahul Verma') {
        throw new Error('TEST 2 & 3 FAILED');
      }
      console.log('TEST 2 & 3 RESULT: PASS\n');

      // --------------------------------------------------
      // TEST 4 — STAGE 1 APPROVAL
      // --------------------------------------------------
      console.log('--- TEST 4: Stage 1 Approval ---');
      const r4 = await makeRequest(`/api/admin/approve/${reqDoc1._id}`, 'PUT', {
        'Authorization': `Bearer ${superToken}`
      });
      console.log('Approval API Response:', r4.data);

      const approvedReq = await HostelRequest.findById(reqDoc1._id);
      const draftHostel = await Hostel.findById(r4.data.hostelId);
      const ownerAfterStage1 = await Owner.findOne({ hostelId: draftHostel._id });
      const subAfterStage1 = await Subscription.findOne({ hostelId: draftHostel._id });

      console.log('HostelRequest status:', approvedReq.status);
      console.log('Hostel pendingActivation:', draftHostel.pendingActivation);
      console.log('Owner created stage 1?:', ownerAfterStage1 !== null);
      console.log('Subscription created stage 1?:', subAfterStage1 !== null);

      if (approvedReq.status !== 'activation_pending' || draftHostel.pendingActivation !== true || ownerAfterStage1 !== null || subAfterStage1 !== null) {
        throw new Error('TEST 4 FAILED');
      }
      console.log('TEST 4 RESULT: PASS\n');

      // --------------------------------------------------
      // TEST 5 & 6 & 7 — SUBSCRIPTION & FINAL ACTIVATION & CREDENTIALS
      // --------------------------------------------------
      console.log('--- TEST 5, 6 & 7: Final Activation & Credentials ---');
      const r6 = await makeRequest(`/api/admin/hostels/${draftHostel._id}/finalize-activation`, 'POST', {
        'Authorization': `Bearer ${superToken}`
      }, {
        planType: 'Pro',
        amount: 2499,
        isTrial: false,
        isFreeAccess: false,
        notes: 'Real-World Acceptance Test Final Activation'
      });
      console.log('Final Activation Response:', r6.data);

      const activeReq = await HostelRequest.findById(reqDoc1._id);
      const activeHostel = await Hostel.findById(draftHostel._id);
      const createdOwner = await Owner.findOne({ hostelId: draftHostel._id });
      const createdSub = await Subscription.findOne({ hostelId: draftHostel._id });

      console.log('Activated Request status:', activeReq.status);
      console.log('Activated Hostel pendingActivation:', activeHostel.pendingActivation);
      console.log('Created Owner Phone:', createdOwner?.phone);
      console.log('Is Password Bcrypt Hashed?:', createdOwner?.password?.startsWith('$2'));
      console.log('Created Subscription Amount:', createdSub?.amount);

      if (activeReq.status !== 'activated' || activeHostel.pendingActivation !== false || !createdOwner || !createdSub || createdSub.amount !== 2499) {
        throw new Error('TEST 5, 6 & 7 FAILED');
      }
      console.log('TEST 5, 6 & 7 RESULT: PASS\n');

      // --------------------------------------------------
      // TEST 8 — OWNER LOGIN
      // --------------------------------------------------
      console.log('--- TEST 8: Owner Login ---');
      const r8 = await makeRequest('/api/owner/login', 'POST', {}, {
        phone: testPhone,
        password: r6.data.credentials?.tempPassword
      });
      console.log('Owner Login Status:', r8.status, 'needsOnboarding:', r8.data?.needsOnboarding);
      if (r8.status !== 200 || !r8.data?.needsOnboarding) {
        throw new Error('TEST 8 FAILED');
      }
      console.log('TEST 8 RESULT: PASS\n');

      // --------------------------------------------------
      // TEST 10 — NEGATIVE TEST (DOUBLE APPROVAL & ACTIVATION)
      // --------------------------------------------------
      console.log('--- TEST 10: Negative Test (Double Approval & Double Activation) ---');
      const r10a = await makeRequest(`/api/admin/approve/${reqDoc1._id}`, 'PUT', {
        'Authorization': `Bearer ${superToken}`
      });
      console.log('Double Approval Response:', r10a.data?.activationAlreadyStarted);

      const r10b = await makeRequest(`/api/admin/hostels/${draftHostel._id}/finalize-activation`, 'POST', {
        'Authorization': `Bearer ${superToken}`
      }, { planType: 'Pro', amount: 2499 });
      console.log('Double Activation Response Code:', r10b.status, 'Message:', r10b.data?.message);

      if (r10b.status !== 400 || r10b.data?.message !== 'Hostel already activated') {
        throw new Error('TEST 10 FAILED');
      }
      console.log('TEST 10 RESULT: PASS\n');

      // --------------------------------------------------
      // TEST 11 — REJECTION TEST
      // --------------------------------------------------
      console.log('--- TEST 11: Rejection Test ---');
      const reqDocReject = await HostelRequest.create({
        hostelName: 'Reject Test Residency',
        ownerName: 'Reject Owner',
        phone: testPhoneReject,
        email: `reject.${testPhoneReject}@example.com`,
        status: 'pending'
      });

      const r11 = await makeRequest(`/api/admin/reject/${reqDocReject._id}`, 'PUT', {
        'Authorization': `Bearer ${superToken}`
      }, { reason: 'Incomplete Aadhaar documentation' });
      console.log('Rejection Response:', r11.data);

      const rejectedDoc = await HostelRequest.findById(reqDocReject._id);
      console.log('Rejected Request status:', rejectedDoc.status);
      if (rejectedDoc.status !== 'rejected') {
        throw new Error('TEST 11 FAILED');
      }
      console.log('TEST 11 RESULT: PASS\n');

      // --------------------------------------------------
      // TEST 12 — ASSIGNMENT TEST
      // --------------------------------------------------
      console.log('--- TEST 12: Assignment Test ---');
      const reqDocAssign = await HostelRequest.create({
        hostelName: 'Assign Test Residency',
        ownerName: 'Assign Owner',
        phone: testPhoneAssign,
        email: `assign.${testPhoneAssign}@example.com`,
        status: 'pending'
      });

      const r12 = await makeRequest(`/api/admin/assign/${reqDocAssign._id}`, 'POST', {
        'Authorization': `Bearer ${superToken}`
      }, { teamName: 'Verification Team', adminId: 'Verification Team' });
      console.log('Assignment Response:', r12.data);

      const assignedDoc = await HostelRequest.findById(reqDocAssign._id);
      console.log('Assigned Request timeline:', assignedDoc.timeline?.slice(-1));
      if (!r12.data?.success) {
        throw new Error('TEST 12 FAILED');
      }
      console.log('TEST 12 RESULT: PASS\n');

      console.log('==================================================');
      console.log('🎉 ALL REAL-WORLD ACCEPTANCE TESTS PASSED 100%!');
      console.log('==================================================\n');

      // Clean up test data
      await HostelRequest.deleteMany({ phone: { $in: [testPhone, testPhoneReject, testPhoneAssign] } });
      await Hostel.deleteMany({ phone: { $in: [testPhone, testPhoneReject, testPhoneAssign] } });
      await Owner.deleteMany({ phone: { $in: [testPhone, testPhoneReject, testPhoneAssign] } });
      await Subscription.deleteMany({ hostelId: draftHostel._id });

      process.exit(0);
    } catch (e) {
      console.error('❌ Acceptance Test Error:', e);
      process.exit(1);
    }
  }, 2500);
}

runFullAcceptanceTest();
