const mongoose = require('mongoose');
const http = require('http');
require('dotenv').config();

require('../server.js');
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hostelmate';
const BASE_URL = 'http://localhost:5000';

async function main() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const HostelRequest = require('../models/HostelRequest');
  const Hostel = require('../models/Hostel');
  const Owner = require('../models/Owner');
  const Subscription = require('../models/Subscription');

  const testPhone = '9998887776';
  await HostelRequest.deleteMany({ phone: testPhone });
  await Hostel.deleteMany({ phone: testPhone });
  await Owner.deleteMany({ phone: testPhone });

  // Get Superadmin JWT
  const jwt = require('jsonwebtoken');
  const adminToken = jwt.sign(
    { userId: '6a5edd0777a1531ddd989188', role: 'super_admin' },
    process.env.JWT_SECRET || 'your_jwt_secret',
    { expiresIn: '1h' }
  );

  console.log('\n--- STEP 1: Admin Manual Owner Registration Submission ---');
  const payload = {
    ownerName: 'Manual Admin Owner',
    phone: testPhone,
    altPhone: '9888777665',
    email: `manual.${testPhone}@example.com`,
    company: 'BetaMind Tech Solutions',
    hostelName: 'BetaMind Executive Residency',
    hostelType: 'Boys Hostel',
    hostelAddress: 'Plot 42, Tech Park',
    city: 'New Delhi',
    district: 'North Delhi',
    state: 'Delhi',
    pincode: '110001',
    roomsCount: 15,
    capacity: 30,
    idType: 'Aadhaar',
    idNumber: '9999 8888 7777',
    aadhaarFile: 'aadhaar_front_sample.png',
    aadhaarBack: 'aadhaar_back_sample.png',
    selfie: 'selfie_sample.png',
    ownerPhoto: 'selfie_sample.png'
  };

  const regRes = await postJSON('/api/auth/approve/new', payload, adminToken);
  console.log('Registration Response:', regRes);
  if (!regRes.success || regRes.status !== 'pending') {
    throw new Error('FAILED: Expected status pending on manual creation');
  }

  const reqDoc = await HostelRequest.findById(regRes.requestId);
  if (!reqDoc || reqDoc.status !== 'pending') {
    throw new Error('FAILED: HostelRequest not found in database with status pending');
  }
  console.log('✓ HostelRequest created in database with status: "pending"');

  const hostelCheck1 = await Hostel.findOne({ phone: testPhone });
  const ownerCheck1 = await Owner.findOne({ phone: testPhone });
  if (hostelCheck1 || ownerCheck1) {
    throw new Error('FAILED: Hostel or Owner created prematurely during registration submission!');
  }
  console.log('✓ Confirmed: Hostel = null, Owner = null at registration submission!');

  console.log('\n--- STEP 2: Superadmin Approval (Stage 1) ---');
  const appRes = await putJSON(`/api/admin/approve/${reqDoc._id}`, {}, adminToken);
  console.log('Approval Response:', appRes);
  if (!appRes.success || appRes.status !== 'activation_pending') {
    throw new Error('FAILED: Expected status activation_pending on approval');
  }

  const approvedReq = await HostelRequest.findById(reqDoc._id);
  const draftHostel = await Hostel.findById(approvedReq.hostelId);
  if (!draftHostel || draftHostel.pendingActivation !== true) {
    throw new Error('FAILED: Draft hostel missing or pendingActivation !== true');
  }
  console.log('✓ Stage 1 Approval passed: Hostel draft created with pendingActivation = true!');

  console.log('\n--- STEP 3: Final Activation (Stage 2) ---');
  const actRes = await postJSON(`/api/admin/hostels/${draftHostel._id}/finalize-activation`, {
    planType: 'Pro',
    amount: 2499,
    isTrial: false,
    isFreeAccess: false,
    notes: 'Admin manual owner creation verified'
  }, adminToken);

  console.log('Final Activation Response:', actRes);
  if (!actRes.success || !actRes.credentials?.tempPassword) {
    throw new Error('FAILED: Final activation did not issue credentials');
  }

  const activeReq = await HostelRequest.findById(reqDoc._id);
  const activeHostel = await Hostel.findById(draftHostel._id);
  const newOwner = await Owner.findOne({ phone: testPhone });
  const newSub = await Subscription.findOne({ hostelId: draftHostel._id });

  if (activeReq.status !== 'activated' || activeHostel.pendingActivation !== false || !newOwner || !newSub) {
    throw new Error('FAILED: Database objects incomplete after final activation!');
  }

  console.log('✓ Final Activation Passed:');
  console.log(`  - HostelRequest status: ${activeReq.status}`);
  console.log(`  - Hostel pendingActivation: ${activeHostel.pendingActivation}`);
  console.log(`  - Owner ID: ${newOwner._id}`);
  console.log(`  - Owner firstLogin: ${newOwner.firstLogin}`);
  console.log(`  - Subscription ID: ${newSub._id} (${newSub.planType} - ₹${newSub.amount})`);

  // Cleanup
  await HostelRequest.deleteMany({ phone: testPhone });
  await Hostel.deleteMany({ phone: testPhone });
  await Owner.deleteMany({ phone: testPhone });
  await Subscription.deleteMany({ hostelId: draftHostel._id });

  await mongoose.disconnect();
  console.log('\n==================================================');
  console.log('🎉 ADMIN MANUAL OWNER CREATION UNIFIED LIFECYCLE VERIFIED!');
  console.log('==================================================');
}

function postJSON(path, data, token) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(data);
    const req = http.request(BASE_URL + path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        'Authorization': `Bearer ${token}`
      }
    }, (res) => {
      let response = '';
      res.on('data', chunk => response += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(response)); } catch(e) { resolve({ response }); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function putJSON(path, data, token) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(data);
    const req = http.request(BASE_URL + path, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        'Authorization': `Bearer ${token}`
      }
    }, (res) => {
      let response = '';
      res.on('data', chunk => response += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(response)); } catch(e) { resolve({ response }); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
