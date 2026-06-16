import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../../src/app.js';

test('login sets session cookie and logout clears it', async () => {
  const { app, store } = await createApp();
  const agent = request.agent(app);

  try {
    const loginResponse = await agent.post('/api/auth/login').send({
      email: 'kacper.witczak@vcn.pl',
      password: 'Kacper123!',
    });

    assert.equal(loginResponse.status, 200);

    const meResponse = await agent.get('/api/auth/me');
    assert.equal(meResponse.status, 200);
    assert.equal(meResponse.body.user.email, 'kacper.witczak@vcn.pl');

    const logoutResponse = await agent.post('/api/auth/logout');
    assert.equal(logoutResponse.status, 200);

    const meAfter = await agent.get('/api/auth/me');
    assert.equal(meAfter.status, 401);
  } finally {
    store.close();
  }
});
