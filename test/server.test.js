const assert = require('assert');
const request = require('supertest');
const sinon = require('sinon');
const { ObjectID } = require('mongodb');

const startServer = require('../server');

const sandbox = sinon.createSandbox();

const testUserId = new ObjectID('000000000000000000000001');
const testUser = {
  _id: testUserId,
  username: 'bob',
  password: '12345',
  firstName: 'Bob',
  favoriteNumber: 42,
  scopes: ['todos:read'],
};

const unauthorizedTestUserId = new ObjectID('000000000000000000000002');
const unauthorizedTestUser = {
  _id: unauthorizedTestUserId,
  username: 'zed',
  password: '123456',
  firstName: 'Zed',
  favoriteNumber: 99,
};

const login = ({ username, password }) => new Promise((resolve, reject) => {
  request('http://localhost:3000')
    .post('/api/login')
    .send({ username, password })
    .end((error, response) => {
      if (error) {
        reject(error);
      } else {
        resolve(response);
      }
    });
});

const whoami = (cookie) => new Promise((resolve, reject) => {
  request('http://localhost:3000')
    .get('/api/whoami')
    .set('cookie', cookie)
    .end((error, response) => {
      if (error) {
        reject(error);
      } else {
        resolve(response);
      }
    });
});

const todos = (cookie) => new Promise((resolve, reject) => {
  request('http://localhost:3000')
    .get('/api/todos')
    .set('cookie', cookie)
    .end((error, response) => {
      if (error) {
        reject(error);
      } else {
        resolve(response);
      }
    });
});

const logout = (cookie) => new Promise((resolve, reject) => {
  request('http://localhost:3000')
    .post('/api/logout')
    .set('cookie', cookie)
    .end((error, response) => {
      if (error) {
        reject(error);
      } else {
        resolve(response);
      }
    });
});

describe('Server test', () => {
  let server;
  let db;
  let dbConnection;

  before(async () => {
    const { server: _server, db: _db, dbConnection: _dbConnection } = await startServer();
    server = _server;
    db = _db;
    dbConnection = _dbConnection;

    await db.collection('sessions').deleteMany({});
    await db.collection('users').deleteMany({});
  });

  after(async () => {
    await server.close();
    await dbConnection.close();
  });

  beforeEach(async () => {
    await db.collection('users').insertMany([testUser, unauthorizedTestUser]);
  });

  afterEach(async () => {
    sandbox.restore();

    await db.collection('sessions').deleteMany({});
    await db.collection('users').deleteMany({});
  });

  it('should successfully login and access a protected route', (done) => {
    let cookie;

    login(testUser)
      .then((loginResponse) => {
        assert.equal(loginResponse.status, 200);
        assert.deepStrictEqual(loginResponse.body, { ...testUser, _id: testUserId.toString() });

        cookie = loginResponse.headers['set-cookie'];
        assert.notEqual(cookie, undefined);

        return whoami(cookie);
      })
      .then((whoamiResponse) => {
        assert.equal(whoamiResponse.status, 200);
        assert.deepStrictEqual(whoamiResponse.body, { ...testUser, _id: testUserId.toString() });

        return logout(cookie);
      })
      .then((logoutResponse) => {
        assert.equal(logoutResponse.status, 200);
        assert.deepStrictEqual(logoutResponse.body, { logout: true });

        done();
      })
      .catch((error) => {
        done(error);
      });
  });

  it('should successfully login and access a protected route with authorization', (done) => {
    let cookie;

    login(testUser)
      .then((loginResponse) => {
        assert.equal(loginResponse.status, 200);
        assert.deepStrictEqual(loginResponse.body, { ...testUser, _id: testUserId.toString() });

        cookie = loginResponse.headers['set-cookie'];
        assert.notEqual(cookie, undefined);

        return todos(cookie);
      })
      .then((todosResponse) => {
        assert.equal(todosResponse.status, 200);
        assert.deepStrictEqual(todosResponse.body, [
          {
            text: 'First todo',
            completed: false,
          },
          {
            text: 'Second todo',
            completed: true,
          },
        ]);

        return logout(cookie);
      })
      .then((logoutResponse) => {
        assert.equal(logoutResponse.status, 200);
        assert.deepStrictEqual(logoutResponse.body, { logout: true });

        done();
      })
      .catch((error) => {
        done(error);
      });
  });

  it('should successfully login but fail to access a protected route with authorization', (done) => {
    let cookie;

    login(unauthorizedTestUser)
      .then((loginResponse) => {
        assert.equal(loginResponse.status, 200);
        assert.deepStrictEqual(loginResponse.body, {
          ...unauthorizedTestUser,
          _id: unauthorizedTestUserId.toString(),
        });

        cookie = loginResponse.headers['set-cookie'];
        assert.notEqual(cookie, undefined);

        return todos(cookie);
      })
      .then((todosResponse) => {
        assert.equal(todosResponse.status, 403);
        assert.deepStrictEqual(todosResponse.body, { message: 'Forbidden' });

        return logout(cookie);
      })
      .then((logoutResponse) => {
        assert.equal(logoutResponse.status, 200);
        assert.deepStrictEqual(logoutResponse.body, { logout: true });

        done();
      })
      .catch((error) => {
        done(error);
      });
  });

  it('should throw an error if the user is not authenticated', async () => {
    const response = await request('http://localhost:3000')
      .get('/api/whoami');

    assert.equal(response.status, 401);
    assert.deepStrictEqual(response.body, { message: 'Authentication required' });
  });

  it('should throw an error if the user could not be found', async () => {
    const response = await request('http://localhost:3000')
      .post('/api/login')
      .send({
        username: 'alice',
        password: testUser.password,
      });

    assert.equal(response.status, 401);
    assert.deepStrictEqual(response.body, { message: 'User alice not found' });
  });

  it('should throw an error if the password is wrong', async () => {
    const response = await request('http://localhost:3000')
      .post('/api/login')
      .send({
        username: testUser.username,
        password: 'wrong password',
      });

    assert.equal(response.status, 401);
    assert.deepStrictEqual(response.body, { message: 'Password incorrect' });
  });

  it('should throw an error if no credentials are send', async () => {
    const response = await request('http://localhost:3000')
      .post('/api/login')
      .send();

    assert.equal(response.status, 401);
    assert.deepStrictEqual(response.body, { message: 'Missing credentials' });
  });

  it('should throw an error if the user could not login because of a database error', async () => {
    sandbox.stub(db, 'collection').throws(new Error('Database error'));

    const loginResponse = await login(testUser);
    assert.equal(loginResponse.status, 500);
  });

  it('should throw an error if the user could not be deserialized because of a database error', async () => {
    const loginResponse = await login(testUser);
    assert.equal(loginResponse.status, 200);
    assert.deepStrictEqual(loginResponse.body, { ...testUser, _id: testUserId.toString() });

    const cookie = loginResponse.headers['set-cookie'];

    sandbox.stub(db, 'collection').withArgs('users').throws(new Error('Database error'));

    const whoamiResponse = await whoami(cookie);
    assert.equal(whoamiResponse.status, 500);
    assert(whoamiResponse.text.includes('Database error'), 'Database error not in response');
  });

  it('should throw an error if the user could not be found after successful login', async () => {
    const loginResponse = await login(testUser);
    assert.equal(loginResponse.status, 200);
    assert.deepStrictEqual(loginResponse.body, { ...testUser, _id: testUserId.toString() });

    const cookie = loginResponse.headers['set-cookie'];

    // Remove user
    await db.collection('users').deleteMany({});

    const whoamiResponse = await whoami(cookie);
    assert.equal(whoamiResponse.status, 401);
    assert.deepStrictEqual(whoamiResponse.body, { message: 'Authentication required' });
  });
});
