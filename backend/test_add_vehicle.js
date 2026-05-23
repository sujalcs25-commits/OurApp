async function run() {
  try {
    const ts = Date.now();
    const payload = {
      name: `Test User ${ts}`,
      email: `test${ts}@example.com`,
      password: 'password123',
      vehicle: {
        make: "Toyota",
        model: "Camry",
        year: "",
        licensePlate: ""
      }
    };
    
    console.log('Sending payload:', payload);

    const regRes = await fetch('http://127.0.0.1:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const regData = await regRes.json();
    if (!regRes.ok) {
      console.error('Error Response:', regRes.status, regData);
    } else {
      console.log('Registered successfully:', regData);
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

run();
