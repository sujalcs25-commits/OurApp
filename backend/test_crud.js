const API_URL = 'http://localhost:5000/api';
let token = '';
let userId = '';
let vehicleId = '';

const testUser = {
  name: 'Test User',
  email: 'test' + Date.now() + '@example.com',
  password: 'Password123'
};

async function runTests() {
  try {
    console.log('--- starting API CRUD Tests ---');

    // 1. Register
    console.log('\n[1] Testing Registration...');
    const regRes = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });
    const regData = await regRes.json();
    if (!regRes.ok) throw new Error(`Registration failed: ${JSON.stringify(regData)}`);
    console.log('✅ Registration Successful:', regData.msg || 'User created');
    token = regData.token;

    // 2. Login
    console.log('\n[2] Testing Login...');
    const loginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testUser.email, password: testUser.password })
    });
    const loginData = await loginRes.json();
    if (!loginRes.ok) throw new Error(`Login failed: ${JSON.stringify(loginData)}`);
    console.log('✅ Login Successful. Token received.');
    token = loginData.token;
    userId = loginData.user.id;

    const authHeaders = { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` 
    };

    // 3. Add Vehicle
    console.log('\n[3] Testing Add Vehicle...');
    const vehicleData = {
      make: 'Toyota',
      model: 'Camry',
      year: 2022,
      licensePlate: 'TEST-123',
      color: 'Blue'
    };
    const addVehicleRes = await fetch(`${API_URL}/vehicles`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(vehicleData)
    });
    const addVehicleData = await addVehicleRes.json();
    if (!addVehicleRes.ok) throw new Error(`Add Vehicle failed: ${JSON.stringify(addVehicleData)}`);
    console.log('✅ Vehicle Added:', addVehicleData.make, addVehicleData.model);
    vehicleId = addVehicleData._id;

    // 4. Get Vehicles
    console.log('\n[4] Testing Get Vehicles...');
    const getVehiclesRes = await fetch(`${API_URL}/vehicles`, { headers: authHeaders });
    const getVehiclesData = await getVehiclesRes.json();
    if (!getVehiclesRes.ok) throw new Error(`Get Vehicles failed: ${JSON.stringify(getVehiclesData)}`);
    console.log('✅ Vehicles Found:', getVehiclesData.length);

    // 5. Update Vehicle
    console.log('\n[5] Testing Update Vehicle...');
    const updateData = { color: 'Red' };
    const updateRes = await fetch(`${API_URL}/vehicles/${vehicleId}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify(updateData)
    });
    const updateResData = await updateRes.json();
    if (!updateRes.ok) throw new Error(`Update Vehicle failed: ${JSON.stringify(updateResData)}`);
    console.log('✅ Vehicle Updated color to:', updateResData.color);

    // 6. Delete Vehicle
    console.log('\n[6] Testing Delete Vehicle...');
    const deleteRes = await fetch(`${API_URL}/vehicles/${vehicleId}`, {
      method: 'DELETE',
      headers: authHeaders
    });
    const deleteData = await deleteRes.json();
    if (!deleteRes.ok) throw new Error(`Delete Vehicle failed: ${JSON.stringify(deleteData)}`);
    console.log('✅ Vehicle Deleted:', deleteData.msg);

    // 7. Verify deletion
    const finalCheckRes = await fetch(`${API_URL}/vehicles`, { headers: authHeaders });
    const finalCheckData = await finalCheckRes.json();
    console.log('✅ Post-delete Vehicle Count:', finalCheckData.length);

    console.log('\n--- All Tests Passed! ---');
  } catch (err) {
    console.error('❌ Test Failed!');
    console.error(err.message);
    process.exit(1);
  }
}

runTests();
