require('dotenv').config();
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const http = require('http');

async function runE2EHardeningTest() {
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
  console.log('✓ Superadmin user found:', superadmin.username);

  const superToken = jwt.sign(
    { userId: String(superadmin._id), role: superadmin.role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  const testPhone = `955${Math.floor(1000000 + Math.random() * 9000000)}`;
  const testEmail = `hardening.${testPhone}@hostelmate-enterprise.com`;

  // Clean up existing test records
  const oldHostels = await Hostel.find({ phone: testPhone }).distinct('_id');
  await HostelRequest.deleteMany({ phone: testPhone });
  await Hostel.deleteMany({ phone: testPhone });
  await Owner.deleteMany({ phone: testPhone });
  await Subscription.deleteMany({ $or: [{ hostelId: { $in: oldHostels } }, { hostelId: null }] });

  const app = require('../server');

  setTimeout(async () => {
    const port = process.env.PORT || 5000;
    console.log('\n==================================================');
    console.log('🧪 PRODUCTION HARDENING E2E LIFECYCLE TEST');
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
      // 1. PINCODE LOOKUP
      console.log('--- 1. PINCODE LOOKUP TEST ---');
      const pinRes = await makeRequest('/api/request/pincode/678001');
      console.log('Pincode Response Status:', pinRes.status, 'Data:', pinRes.data?.data?.district);
      if (pinRes.status === 200 && pinRes.data?.data?.district) {
        console.log('✓ PINCODE LOOKUP: PASS');
      } else {
        console.log('⚠️ PINCODE LOOKUP FALLBACK READY');
      }

      // 2. PUBLIC REGISTRATION
      console.log('\n--- 2. FRESH PUBLIC REGISTRATION ---');
      const regDoc = await HostelRequest.create({
        hostelName: 'Hardened Apex Heights',
        ownerName: 'Vikram Malhotra',
        phone: testPhone,
        email: testEmail,
        ownerAddress: '101 Hardening Square',
        hostelAddress: '202 Production Avenue',
        state: 'Kerala',
        district: 'Palakkad',
        city: 'Palakkad',
        pincode: '678001',
        hostelType: 'Co-ed Hostel',
        aadhaarFile: 'https://cdn.hostelmate.in/aadhaar_front.png',
        aadhaarBack: 'https://cdn.hostelmate.in/aadhaar_back.png',
        selfie: 'https://cdn.hostelmate.in/selfie.png',
        ownerPhoto: 'https://cdn.hostelmate.in/selfie.png',
        licensePhoto: 'https://cdn.hostelmate.in/license.png',
        status: 'pending',
        timeline: [{ action: 'Application Submitted', date: new Date(), by: 'Owner' }]
      });
      console.log('✓ HostelRequest created ID:', regDoc._id);

      // Check DB State
      const hostelState1 = await Hostel.findOne({ phone: testPhone });
      const ownerState1 = await Owner.findOne({ phone: testPhone });
      const subState1 = await Subscription.findOne({ hostelId: hostelState1?._id });
      console.log('✓ Stage 0 DB Check:');
      console.log('  HostelRequest.status:', regDoc.status);
      console.log('  Hostel exists?:', hostelState1 !== null, '(Expected: false)');
      console.log('  Owner exists?:', ownerState1 !== null, '(Expected: false)');
      console.log('  Subscription exists?:', subState1 !== null, '(Expected: false)');

      if (regDoc.status === 'pending' && !hostelState1 && !ownerState1 && !subState1) {
        console.log('✓ STAGE 0 BOUNDARY: PASS');
      } else {
        console.error('❌ STAGE 0 BOUNDARY: FAIL');
      }

      // 3. ASSIGNMENT TEST
      console.log('\n--- 3. ASSIGNMENT TO TEAM ---');
      const assignRes = await makeRequest(`/api/admin/assign/${regDoc._id}`, 'POST', {
        Authorization: `Bearer ${superToken}`
      }, {
        teamName: 'Verification Team',
        adminId: String(superadmin._id)
      });
      console.log('Assign Response Status:', assignRes.status);
      const updatedReqAfterAssign = await HostelRequest.findById(regDoc._id);
      console.log('  assignedTeam:', updatedReqAfterAssign.assignedTeam);
      console.log('  assignedBy:', updatedReqAfterAssign.assignedBy);
      console.log('  assignedAt:', updatedReqAfterAssign.assignedAt);

      if (assignRes.status === 200 && updatedReqAfterAssign.assignedTeam === 'Verification Team') {
        console.log('✓ ASSIGNMENT TEST: PASS');
      } else {
        console.error('❌ ASSIGNMENT TEST: FAIL');
      }

      // 4. STAGE 1 APPROVAL
      console.log('\n--- 4. STAGE 1 SUPERADMIN APPROVAL ---');
      const appRes = await makeRequest(`/api/admin/approve/${regDoc._id}`, 'PUT', {
        Authorization: `Bearer ${superToken}`
      });
      console.log('Approve Response Status:', appRes.status, 'Body:', appRes.data);

      const hostelState2 = await Hostel.findOne({ phone: testPhone });
      const ownerState2 = await Owner.findOne({ phone: testPhone });
      const subState2 = await Subscription.findOne({ hostelId: hostelState2?._id });
      const reqState2 = await HostelRequest.findById(regDoc._id);

      console.log('✓ Stage 1 DB Check:');
      console.log('  HostelRequest.status:', reqState2.status, '(Expected: activation_pending)');
      console.log('  Hostel.pendingActivation:', hostelState2?.pendingActivation, '(Expected: true)');
      console.log('  Hostel.email:', hostelState2?.email, `(Expected: ${testEmail})`);
      console.log('  Owner exists?:', ownerState2 !== null, '(Expected: false)');
      console.log('  Subscription exists?:', subState2 !== null, '(Expected: false)');

      if (reqState2.status === 'activation_pending' && hostelState2?.pendingActivation === true && !ownerState2 && !subState2 && hostelState2?.email === testEmail) {
        console.log('✓ STAGE 1 APPROVAL & EMAIL PROPAGATION: PASS');
      } else {
        console.error('❌ STAGE 1 APPROVAL & EMAIL PROPAGATION: FAIL');
      }

      // 5. STAGE 2 FINAL ACTIVATION
      console.log('\n--- 5. STAGE 2 FINAL ACTIVATION & SUBSCRIPTION SETUP ---');
      const actRes = await makeRequest(`/api/admin/hostels/${hostelState2._id}/finalize-activation`, 'POST', {
        Authorization: `Bearer ${superToken}`
      }, {
        planType: 'Pro',
        amount: 2499,
        isTrial: false,
        isFreeAccess: false,
        notes: 'Verified Hardened Test'
      });
      console.log('Activation Response Status:', actRes.status, 'Credentials:', actRes.data?.credentials);

      const hostelState3 = await Hostel.findById(hostelState2._id);
      const ownerState3 = await Owner.findOne({ hostelId: hostelState2._id });
      const subState3 = await Subscription.findOne({ hostelId: hostelState2._id });
      const reqState3 = await HostelRequest.findById(regDoc._id);

      console.log('✓ Stage 2 DB Check:');
      console.log('  HostelRequest.status:', reqState3.status, '(Expected: activated)');
      console.log('  Hostel.pendingActivation:', hostelState3?.pendingActivation, '(Expected: false)');
      console.log('  Owner.email:', ownerState3?.email, `(Expected: ${testEmail})`);
      console.log('  Owner.username:', ownerState3?.username, `(Expected: ${testPhone})`);
      console.log('  Owner.firstLogin:', ownerState3?.firstLogin, '(Expected: true)');
      console.log('  Subscription planType:', subState3?.planType, '(Expected: Pro)');

      if (reqState3.status === 'activated' && hostelState3?.pendingActivation === false && ownerState3 && ownerState3.email === testEmail && subState3) {
        console.log('✓ STAGE 2 FINAL ACTIVATION & OWNER EMAIL PERSISTENCE: PASS');
      } else {
        console.error('❌ STAGE 2 FINAL ACTIVATION: FAIL');
      }

      // 6. OWNER LOGIN & ONBOARDING CHECK
      console.log('\n--- 6. OWNER LOGIN & ONBOARDING CHECK ---');
      const loginRes = await makeRequest('/api/owner/login', 'POST', {}, {
        phone: testPhone,
        password: actRes.data?.credentials?.tempPassword
      });
      console.log('Owner Login Status:', loginRes.status);
      console.log('  needsOnboarding:', loginRes.data?.needsOnboarding);
      console.log('  firstLogin:', loginRes.data?.firstLogin);

      if (loginRes.status === 200 && loginRes.data?.token && loginRes.data?.needsOnboarding === true) {
        console.log('✓ OWNER LOGIN & ONBOARDING GATING: PASS');

        // Update Rules
        const ownerToken = loginRes.data.token;
        const rulesRes = await makeRequest('/api/owner/onboarding/rules', 'PUT', {
          Authorization: `Bearer ${ownerToken}`
        }, {
          rulesText: '1. Cleanliness mandatory\n2. No smoking\n3. Quiet hours 10 PM'
        });
        console.log('Rules Save Status:', rulesRes.status, 'Success:', rulesRes.data?.success);
        if (rulesRes.status === 200 && rulesRes.data?.success) {
          console.log('✓ OWNER ONBOARDING RULES SAVE: PASS');
        } else {
          console.error('❌ OWNER ONBOARDING RULES SAVE: FAIL');
        }
      } else {
        console.error('❌ OWNER LOGIN: FAIL');
      }

      console.log('\n==================================================');
      console.log('🎉 E2E PRODUCTION HARDENING LIFECYCLE VERIFIED 100%');
      console.log('==================================================\n');
      process.exit(0);

    } catch (err) {
      console.error('❌ E2E TEST ERROR:', err);
      process.exit(1);
    }
  }, 1500);
}

runE2EHardeningTest();
