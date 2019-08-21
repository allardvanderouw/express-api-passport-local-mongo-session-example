const assert = require('assert');

const { MongoClient } = require('mongodb');

const createUser = require('../scripts/create-user');

const mongoDbUri = process.env.MONGODB_URI;
const mongoDbName = process.env.MONGODB_NAME;

describe('Create user test', () => {
  let db;
  let dbConnection;

  before(async () => {
    // Connect to Mongo DB
    const dbConnectionOptions = { useNewUrlParser: true, useUnifiedTopology: true };
    dbConnection = await MongoClient.connect(mongoDbUri, dbConnectionOptions);
    db = dbConnection.db(mongoDbName);

    // Clear collections
    await db.collection('sessions').deleteMany({});
    await db.collection('users').deleteMany({});
  });

  after(async () => {
    await dbConnection.close();
  });

  it('should create the test user', async () => {
    // There should not be any users at this time
    const usersBeforeCreate = await db.collection('users').find().toArray();
    assert.deepEqual(usersBeforeCreate, []);

    // Create the user
    const createdUser = await createUser();

    // The user should be created
    const usersAfterCreate = await db.collection('users').find().toArray();
    assert.deepEqual(usersAfterCreate, [createdUser]);
  });
});
