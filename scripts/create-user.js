const { MongoClient } = require('mongodb');

const createUser = async ({
  mongoDbUri = process.env.MONGODB_URI,
  mongoDbName = process.env.MONGODB_NAME,
} = {}) => {
  // Connect to Mongo DB
  const dbConnection = await MongoClient.connect(mongoDbUri, { useNewUrlParser: true });
  const db = dbConnection.db(mongoDbName);

  const user = {
    username: 'bob',
    password: '12345',
    firstName: 'Bob',
    favoriteNumber: 42,
  };

  // Create user
  const { ops: { 0: createdUser } } = await db.collection('users').insertOne(user);
  console.info(`User ${user.username} created successfully`);

  // Close DB connection
  await dbConnection.close();

  return createdUser;
};

module.exports = createUser;

/* istanbul ignore next */
if (!module.parent) createUser();
