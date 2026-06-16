import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../src/app.js';

test('GET /api/health returns a healthy response', async () => {
  const { app, store } = await createApp();

  try {
    const response = await request(app).get('/api/health');

    assert.equal(response.status, 200);
    assert.equal(response.body.message, 'Auth server is healthy');
  } finally {
    store.close();
  }
});

test('login, authorize and token exchange work together', async () => {
  const { app, store } = await createApp();
  const agent = request.agent(app);

  try {
    const loginResponse = await agent.post('/api/auth/login').send({
      email: 'kacper.witczak@vcn.pl',
      password: 'Kacper123!',
    });

    assert.equal(loginResponse.status, 200);

    const authorizeResponse = await agent.post('/api/auth/authorize').send({
      appId: 2,
      redirectUri: 'http://localhost:5174/callback',
    });

    assert.equal(authorizeResponse.status, 200);
    assert.ok(authorizeResponse.body.code);

    const tokenResponse = await request(app).post('/api/auth/token').send({
      code: authorizeResponse.body.code,
      appId: 2,
      secretKey: 'store-app-dev-secret',
    });

    assert.equal(tokenResponse.status, 200);
    assert.ok(tokenResponse.body.token);
  } finally {
    store.close();
  }
});