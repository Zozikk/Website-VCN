import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../../src/app.js';

test('admin CRUD endpoints manage users, apps and permissions', async () => {
  const { app, store } = await createApp();
  const agent = request.agent(app);

  try {
    const loginResponse = await agent.post('/api/auth/login').send({
      email: 'kacper.witczak@vcn.pl',
      password: 'Kacper123!',
    });

    assert.equal(loginResponse.status, 200);

    const createdUser = await agent.post('/api/admin/users').send({
      email: 'new.user@example.com',
      password: 'Password123!',
      appId: 1,
      role: 'viewer',
    });

    assert.equal(createdUser.status, 201);
    assert.equal(createdUser.body.user.email, 'new.user@example.com');

    const createdApp = await agent.post('/api/admin/apps').send({
      name: 'Audit Portal',
      allowedRedirect: 'http://localhost:5174/callback',
    });

    assert.equal(createdApp.status, 201);
    assert.equal(createdApp.body.app.name, 'Audit Portal');

    const permissionsBefore = await agent.get('/api/admin/permissions');
    assert.equal(permissionsBefore.status, 200);
    assert.ok(Array.isArray(permissionsBefore.body.permissions));

    const createdPermission = await agent.post('/api/admin/permissions').send({
      userId: createdUser.body.user.id,
      appId: createdApp.body.app.id,
      role: 'editor',
    });

    assert.equal(createdPermission.status, 201);

    const permissionsAfter = await agent.get('/api/admin/permissions');
    assert.equal(permissionsAfter.status, 200);

    const permissionRecord = permissionsAfter.body.permissions.find(
      (permission) => permission.userId === createdUser.body.user.id && permission.appId === createdApp.body.app.id,
    );

    assert.ok(permissionRecord);

    const deletePermission = await agent.delete(`/api/admin/permissions/${permissionRecord.id}`);
    assert.equal(deletePermission.status, 204);

    const deleteUser = await agent.delete(`/api/admin/users/${createdUser.body.user.id}`);
    assert.equal(deleteUser.status, 204);

    const deleteApp = await agent.delete(`/api/admin/apps/${createdApp.body.app.id}`);
    assert.equal(deleteApp.status, 204);
  } finally {
    store.close();
  }
});
