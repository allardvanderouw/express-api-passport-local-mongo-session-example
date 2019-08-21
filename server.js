const { MongoClient, ObjectID } = require('mongodb');
const passport = require('passport');
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const { ensureAuthenticated } = require('connect-ensure-authenticated');
const { ensureScope } = require('connect-ensure-authorization');
const LocalStrategy = require('passport-local').Strategy;

// The Passport LocalStrategy is used for username/password authentication.
// The 'username' and 'password' fields are automatically parsed from the request JSON body or
// urlencoded parameters.
// These default fieldnames can be altered as documented in Passport documentation.
//
// With the username and password you can authenticate and perform a callback with the done
// parameter:
// Error callback: done(new Error('something unexpected happened'))
// Invalid callback: done(null, false, { message: 'incorrect username/password' })
// Success callback: done(null, { firstName: 'bob', ...rest })
const localStrategy = (db) => new LocalStrategy(async (username, password, done) => {
  try {
    const user = await db.collection('users').findOne({ username });
    if (!user) {
      done(null, false, { message: `User ${username} not found` });
    } else if (user.password !== password) {
      // !!! You should not store the password with the user unencrypted
      // !!! You should store the password and the user id in a seperate collection (credentials)
      // !!! You should encrypt the password using Node Crypto and compare the encrypted values
      done(null, false, { message: 'Password incorrect' });
    } else {
      done(null, user);
    }
  } catch (error) {
    done(error);
  }
});

// The serializeUser function is called to serialize the user into a value for the session.
// You should only hold key information to identify a unique user, for example the ID.
//
// Error callback: done(new Error('something happened'))
// Success callback: done(null, user.id)
const serializeUser = (user, done) => {
  const { _id: userId } = user;
  done(null, userId.toString());
};

// The deserializeUser function is called to deserialize the session information (stored via
// serializeUser).
// The previously stored serialized data should be used to identify and return the user object.
// The returned value from this function is stored in req.user.
const deserializeUser = (db) => async (userId, done) => {
  try {
    const user = await db.collection('users').findOne({ _id: new ObjectID(userId) });
    if (!user) {
      done(null, false, { message: 'User not found' });
    } else {
      done(null, user);
    }
  } catch (error) {
    done(error);
  }
};

const startServer = async ({
  port = process.env.PORT,
  mongoDbUri = process.env.MONGODB_URI,
} = {}) => {
  const app = express();

  // Connect to Mongo DB
  const dbConnectionOptions = { useNewUrlParser: true, useUnifiedTopology: true };
  const dbConnection = await MongoClient.connect(mongoDbUri, dbConnectionOptions);
  const db = dbConnection.db();

  // Configure app
  app.use(cookieParser()); // cookieParser is used to parse the session cookie
  app.use(bodyParser.urlencoded({ extended: true })); // parse urlencoded data to req.body
  app.use(bodyParser.json()); // parse json data to req.body
  app.use(session({ // use session for user sessions
    secret: 'keyboard cat', // this should be something secret
    resave: true, // extend the session automatically
    saveUninitialized: false, // don't save uninitialized sessions
    store: new MongoStore({ client: dbConnection }), // save in MongoDB to persist sessions
  }));

  // Setup passport
  passport.use(localStrategy(db));
  passport.serializeUser(serializeUser);
  passport.deserializeUser(deserializeUser(db));

  app.use(passport.initialize()); // Initialize passport
  app.use(passport.session()); // Add login session

  // Add authentication requirement for all endpoints except /api/login
  app.use(ensureAuthenticated().unless({
    path: ['/api/login'],
  }));

  // Login API
  app.post('/api/login', (req, res, next) => {
    // Login with Passport Local Strategy
    passport.authenticate('local', (authenticationError, user, info) => {
      if (authenticationError) {
        // Technical error in Local Strategy validation (e.g. DB unavailable)
        res.status(500);
        res.json(authenticationError);
      } else if (info) {
        // Functional error in Local Strategy validation (e.g. user or password wrong)
        res.status(401);
        res.json(info);
      } else {
        req.logIn(user, () => {
          res.status(200);
          res.json(user);
        });
      }
    })(req, res, next);
  });

  // API which can only be accessed when authenticated
  app.get('/api/whoami', (req, res) => {
    res.status(200);
    res.json(req.user);
  });

  // API which can only be accessed when authorized
  app.get('/api/todos', ensureScope('todos:read'), (req, res) => {
    res.status(200);
    res.json([{
      text: 'First todo',
      completed: false,
    }, {
      text: 'Second todo',
      completed: true,
    }]);
  });

  // Logout API
  app.post('/api/logout', (req, res) => {
    req.logout();
    res.json({ logout: true });
  });

  const server = await app.listen(port);
  console.info(`Server started and listening on port ${port}`);

  return { server, db, dbConnection };
};

module.exports = startServer;

/* istanbul ignore next */
if (!module.parent) startServer();
