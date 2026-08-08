require('dotenv').config();
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const http = require('http');

async function testCanonicalLifecycle() {
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

  // Use unique phone number for complete test isolation
  const testPhone = `999${Math.floor(1000000 + Math.random() * 9000000)}`;

  // Clean up any pre-existing test data with this phone
  await HostelRequest.deleteMany({ phone: testPhone });
  await Hostel.deleteMany({ phone: testPhone });
  await Owner.deleteMany({ phone: testPhone });

  const app = require('../server');

  setTimeout(async () => {
    const port = process.env.PORT || 5000;
    console.log('Testing Canonical Owner Lifecycle against running server on port', port);

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
      console.log('\n--- STEP 1: Owner Registration (Pending Request Creation) ---');
      const requestDoc = await HostelRequest.create({
        hostelName: 'Royal Grand Residency',
        ownerName: 'Vikram Malhotra',
        phone: testPhone,
        email: `vikram.${testPhone}@example.com`,
        ownerAddress: '789 Central Avenue, MG Road',
        hostelAddress: '101 Residency Park, Civil Lines',
        state: 'Karnataka',
        district: 'Bangalore',
        city: 'Bangalore',
        pincode: '560001',
        hostelType: 'Co-living',
        aadhaarFile: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500',
        ownerPhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500',
        licensePhoto: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=500',
        status: 'pending',
        timeline: [{ action: 'Submitted Registration', date: new Date(), by: 'Owner' }]
      });

      console.log('Created Request ID:', requestDoc._id, 'Status:', requestDoc.status);
      if (requestDoc.status !== 'pending') throw new Error('Step 1 Failed: status is not pending');

      console.log('\n--- STEP 2: Superadmin Approval (Stage 1) ---');
      const r2 = await makeRequest(`/api/admin/approve/${requestDoc._id}`, 'PUT', {
        'Authorization': `Bearer ${superToken}`
      });
      console.log('HTTP Status:', r2.status);
      console.log('Result:', r2.status === 200 ? 'PASS' : 'FAIL', r2.data);

      const approvedRequest = await HostelRequest.findById(requestDoc._id);
      console.log('After Approval Request Status:', approvedRequest?.status);
      if (approvedRequest?.status !== 'activation_pending') throw new Error('Step 2 Failed: request status is not activation_pending');

      const draftHostel = await Hostel.findById(r2.data.hostelId);
      console.log('Draft Hostel pendingActivation:', draftHostel?.pendingActivation);
      if (draftHostel?.pendingActivation !== true) throw new Error('Step 2 Failed: draft hostel pendingActivation is not true');

      const ownerCheckBeforeActivation = await Owner.findOne({ hostelId: draftHostel._id });
      console.log('Owner exists before activation?:', ownerCheckBeforeActivation !== null);
      if (ownerCheckBeforeActivation !== null) throw new Error('Step 2 Failed: Owner was prematurely created during approval!');

      console.log('\n--- STEP 3: Finalize Activation & Subscription Setup (Stage 2) ---');
      const r3 = await makeRequest(`/api/admin/hostels/${draftHostel._id}/finalize-activation`, 'POST', {
        'Authorization': `Bearer ${superToken}`
      }, {
        planType: 'Pro',
        amount: 2499,
        isTrial: false,
        isFreeAccess: false,
        notes: 'End-to-End Test Subscription Activation'
      });
      console.log('HTTP Status:', r3.status);
      console.log('Result:', r3.status === 200 ? 'PASS' : 'FAIL', r3.data);

      const activeHostel = await Hostel.findById(draftHostel._id);
      console.log('After Activation Hostel pendingActivation:', activeHostel?.pendingActivation);
      if (activeHostel?.pendingActivation !== false) throw new Error('Step 3 Failed: hostel pendingActivation is not false');

      const activeRequest = await HostelRequest.findById(requestDoc._id);
      console.log('After Activation Request Status:', activeRequest?.status);
      if (activeRequest?.status !== 'activated') throw new Error('Step 3 Failed: request status is not activated');

      const createdOwner = await Owner.findOne({ hostelId: draftHostel._id });
      console.log('Created Owner:', createdOwner?.ownerName, 'Phone:', createdOwner?.phone);
      if (!createdOwner) throw new Error('Step 3 Failed: Owner was not created during finalize activation');

      const subDoc = await Subscription.findOne({ hostelId: draftHostel._id });
      console.log('Created Subscription Plan:', subDoc?.planType, 'Amount:', subDoc?.amount);
      if (!subDoc) throw new Error('Step 3 Failed: Subscription record was not created');

      console.log('\n--- STEP 4: Owner Login Test ---');
      const r4 = await makeRequest('/api/owner/login', 'POST', {}, {
        phone: testPhone,
        password: r3.data.credentials?.tempPassword
      });
      console.log('HTTP Status:', r4.status);
      console.log('Login Response:', r4.data?.success ? 'PASS' : 'FAIL', 'needsOnboarding:', r4.data?.needsOnboarding);
      if (!r4.data?.success) throw new Error('Step 4 Failed: Owner login with temp password failed');

      console.log('\n--- STEP 5: Negative Idempotency Test (Double Activation) ---');
      const r5 = await makeRequest(`/api/admin/hostels/${draftHostel._id}/finalize-activation`, 'POST', {
        'Authorization': `Bearer ${superToken}`
      }, { planType: 'Pro', amount: 2499 });
      console.log('HTTP Status:', r5.status, '(Expected: 400)');
      console.log('Message:', r5.data?.message);
      if (r5.status !== 400) throw new Error('Step 5 Failed: Double activation was not prevented!');

      console.log('\n======================================================');
      console.log('🎉 CANONICAL OWNER LIFECYCLE 100% VERIFIED & PASSED!');
      console.log('======================================================');

      // Cleanup test data
      await HostelRequest.deleteMany({ phone: testPhone });
      await Hostel.deleteMany({ phone: testPhone });
      await Owner.deleteMany({ phone: testPhone });
      await Subscription.deleteMany({ hostelId: draftHostel._id });

      process.exit(0);
    } catch (e) {
      console.error('❌ Lifecycle Test Error:', e);
      process.exit(1);
    }
  }, 2500);
}

testCanonicalLifecycle();
