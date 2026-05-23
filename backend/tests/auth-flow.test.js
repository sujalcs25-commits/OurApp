const test = require('node:test');
const assert = require('node:assert/strict');

const app = require('../server');
const { writeStore } = require('../data/store');

let server;
let baseUrl;

test.before(async () => {
  process.env.JWT_SECRET = 'test_secret_key';
  await writeStore({ users: [], vehicles: [] });

  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));

  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
});

test.after(async () => {
  await writeStore({ users: [], vehicles: [] });

  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  }
});

test('registers a user with a vehicle, logs in, and returns scoped vehicles', async () => {
  const registerResponse = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: 'Jamie Driver',
      email: 'jamie@example.com',
      password: 'strongpass1',
      vehicle: {
        make: 'Tesla',
        model: 'Model 3',
        year: '2024',
        licensePlate: 'ABC1234',
      },
    }),
  });

  assert.equal(registerResponse.status, 201);
  const registeredUser = await registerResponse.json();
  assert.ok(registeredUser.token);
  assert.equal(registeredUser.user.email, 'jamie@example.com');
  assert.equal(registeredUser.vehicles.length, 1);

  const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'jamie@example.com',
      password: 'strongpass1',
    }),
  });

  assert.equal(loginResponse.status, 200);
  const loggedInUser = await loginResponse.json();
  assert.ok(loggedInUser.token);

  const vehiclesResponse = await fetch(`${baseUrl}/api/vehicles`, {
    headers: {
      Authorization: `Bearer ${loggedInUser.token}`,
    },
  });

  assert.equal(vehiclesResponse.status, 200);
  const vehicles = await vehiclesResponse.json();
  assert.equal(vehicles.length, 1);
  assert.equal(vehicles[0].make, 'Tesla');
});
