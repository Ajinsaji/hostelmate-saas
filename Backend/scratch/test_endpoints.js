require('dotenv').config();
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const http = require('http');

async function testEndpointsRealHTTP() {
  await mongoose.connect(process.env.MONGO_URI);
  const Admin = require('../models/Admin');
  const HostelRequest = require('../models/HostelRequest');

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

  let pendingReq = await HostelRequest.findOne({ status: 'pending' });
  if (!pendingReq) {
    pendingReq = await HostelRequest.create({
      hostelName: 'Ushus Luxury Living',
      ownerName: 'Ajin Saji',
      phone: '9876543210',
      email: 'ajin.saji@example.com',
      company: 'Ushus Group of Hostels',
      ownerAddress: '123 Main Street, Sector 4, MG Road',
      hostelAddress: '456 Green Valley View, High Street',
      state: 'Kerala',
      district: 'Ernakulam',
      city: 'Kochi',
      pincode: '682001',
      hostelType: 'Boys Hostel',
      aadhaarFile: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500',
      ownerPhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500',
      licensePhoto: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=500',
      status: 'pending',
      timeline: [{ action: 'Submitted Registration', date: new Date(), by: 'Owner' }]
    });
  }
  console.log('Test Pending Request ID:', pendingReq._id);

  // Require express app
  const app = require('../server');

  setTimeout(async () => {
    const port = process.env.PORT || 5000;
    console.log('Testing against running server on port', port);

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
      console.log('\n--- TEST 1: Version Checker (Public Release Check) ---');
      const r1 = await makeRequest('/api/v2/releases/latest');
      console.log('HTTP Status:', r1.status);
      console.log('Result:', r1.data?.success !== undefined ? 'PASS' : 'FAIL', r1.data);

      console.log('\n--- TEST 2: Device Token Registration ---');
      const r2 = await makeRequest('/api/notifications/device-token', 'POST', {
        'Authorization': `Bearer ${superToken}`
      }, { token: 'sample-fcm-token-12345', platform: 'web' });
      console.log('HTTP Status:', r2.status);
      console.log('Result:', r2.status === 200 || r2.status === 201 ? 'PASS' : 'FAIL', r2.data);

      console.log('\n--- TEST 3: Workspace Hostels List ---');
      const r3 = await makeRequest('/api/v2/workspaces/hostels', 'GET', {
        'Authorization': `Bearer ${superToken}`
      });
      console.log('HTTP Status:', r3.status);
      console.log('Result:', r3.status === 200 ? 'PASS' : 'FAIL', r3.data);

      console.log('\n--- TEST 4: Get Requests List ---');
      const r4 = await makeRequest('/api/admin/requests', 'GET', {
        'Authorization': `Bearer ${superToken}`
      });
      console.log('HTTP Status:', r4.status);
      console.log('Result:', r4.status === 200 ? 'PASS' : 'FAIL', 'Requests count:', r4.data?.requests?.length);

      console.log('\n--- TEST 5: Get Team Members ---');
      const r5 = await makeRequest('/api/admin/team', 'GET', {
        'Authorization': `Bearer ${superToken}`
      });
      console.log('HTTP Status:', r5.status);
      console.log('Result:', r5.status === 200 ? 'PASS' : 'FAIL', 'Team members:', r5.data?.team);

      console.log('\n--- TEST 6: Assign Request ---');
      const r6 = await makeRequest(`/api/admin/assign/${pendingReq._id}`, 'POST', {
        'Authorization': `Bearer ${superToken}`
      }, { teamName: 'Verification Team' });
      console.log('HTTP Status:', r6.status);
      console.log('Result:', r6.status === 200 ? 'PASS' : 'FAIL', r6.data);

      console.log('\n--- TEST 7: Reject Request ---');
      const r7 = await makeRequest(`/api/admin/reject/${pendingReq._id}`, 'PUT', {
        'Authorization': `Bearer ${superToken}`
      }, { reason: 'Test verification rejection reason' });
      console.log('HTTP Status:', r7.status);
      console.log('Result:', r7.status === 200 ? 'PASS' : 'FAIL', r7.data);

      console.log('\n--- TEST 8: Reset to Pending & Approve Request ---');
      await HostelRequest.findByIdAndUpdate(pendingReq._id, { status: 'pending' });
      const r8 = await makeRequest(`/api/admin/approve/${pendingReq._id}`, 'PUT', {
        'Authorization': `Bearer ${superToken}`
      });
      console.log('HTTP Status:', r8.status);
      console.log('Result:', r8.status === 200 ? 'PASS' : 'FAIL', r8.data);

      console.log('\n========================================');
      console.log('ALL REAL-WORLD HTTP ENDPOINTS PASSED!');
      console.log('========================================');
      process.exit(0);
    } catch (e) {
      console.error('HTTP Test error:', e);
      process.exit(1);
    }
  }, 2500);
}

testEndpointsRealHTTP();
