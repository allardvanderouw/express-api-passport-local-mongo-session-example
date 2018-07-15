# express-api-passport-local-mongo-session-example

[![Build Status](https://travis-ci.com/allardvanderouw/express-api-passport-local-mongo-session-example.svg?branch=master)](https://travis-ci.com/allardvanderouw/express-api-passport-local-mongo-session-example)
[![codecov](https://codecov.io/gh/allardvanderouw/express-api-passport-local-mongo-session-example/branch/master/graph/badge.svg)](https://codecov.io/gh/allardvanderouw/express-api-passport-local-mongo-session-example)

This example provides a single-file-implementation ([server.js](./server.js)) of an [Express](https://github.com/expressjs/express) API server with [Passport](https://github.com/jaredhanson/passport) and persistent sessions in [Mongo DB](https://github.com/mongodb/mongo) with [connect-mongo](https://github.com/jdesboeufs/connect-mongo). 

I made this example because I could not find an easy full example online. If you are looking for an Example with views and redirecting without persistent sessions, then you are better off with [Jared Hanson's Express 4.x local example](https://github.com/passport/express-4.x-local-example). Or with a combination of that example and this example.

I hope you find this example useful, if you are missing something please let me know.

## Modules

| Module | Reason |
| - | - |
| [express](https://github.com/expressjs/express) | Web Framework |
| [express-session](https://github.com/expressjs/session) | Sessions for Express |
| [mongodb](https://github.com/mongodb/mongo) | MongoDB driver |
| [connect-mongo](https://github.com/jdesboeufs/connect-mongo) | Save Express sessions to MongoDB for persistency |
| [body-parser](https://github.com/expressjs/body-parser) | Parse HTTP request body |
| [cookie-parser](https://github.com/expressjs/cookie-parser) | Parse HTTP request cookies |
| [passport](https://github.com/jaredhanson/passport) | Authentication middleware for Express |
| [passport-local](https://github.com/jaredhanson/passport-local) | Username/passport authentication strategy for Passport |
| [connect-ensure-authenticated](https://github.com/allardvanderouw/connect-ensure-authenticated) | Passport authentication middleware for Express |

## Example

With the below steps you should be able to start the server and login with Vagrant. You can also run this without Vagrant if you are running Mongo DB locally and have Node.js 8 or higher, then you can start from step 4.

1. `vagrant up`: Start the VM
2. `vagrant ssh`: Connect to the VM
3. `cd /vagrant`: Navigate to project folder
4. `yarn create:user`: Create user bob  
   User `bob` has password `12345` which is saved in the user collection with the user details.  
   **!!! You should not save the passport with the user unencrypted. You should create a separate collection (e.g. credentials) and store an encrypted password with [crypto](https://nodejs.org/api/crypto.html) or another encryption library.**
5. `yarn start`: Start the server
6. Open Postman (or another API caller) and POST the below JSON to `http://localhost:3000/api/login`:
   ```json
   {
     "username": "bob",
     "password": "12345"
   }
   ```
   This should return the JSON:
   ```json
   {
     "_id": "...",
     "username": "bob",
     "password": "12345",
     "firstName": "Bob",
     "favoriteNumber": 42
   }
   ```
7. You are now logged in and should be able to GET `http://localhost:3000/api/whoami`. Even after a server restart due to [connect-mongo](https://github.com/jdesboeufs/connect-mongo).

## Test

You can test this exampe by running `vagrant up` and then the usual `vagrant ssh`, `cd /vagrant` and `yarn test`.

The test creates a default user:
```json
{
  "username": "bob",
  "password": "12345",
  "firstName": "Bob",
  "favoriteNumber": 42
}
```

And then logs in with it.
