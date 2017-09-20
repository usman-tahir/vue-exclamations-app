
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const flash = require('flash');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const uuid = require('node-uuid');
const appData = require('./data.json');

// App data (mimics a database)
const userData = appData.users;
const exclamations = appData.exclamations;

function getUser(username) {
  const user = userData.find(u => u.username === username);
  return Object.assign({}, user);
}

// Create a default port
const PORT = process.env.PORT || 3000;

// Create a new server with Express
const server = express();

// Configure the Express server
server.use(bodyParser.json());
server.use(bodyParser.urlencoded({extended: false}));
server.use(session({
  secret: process.env.SESSION_SECRET || 'secret',
  resave: false,
  saveUninitialized: false,
  store: new MongoStore({
    url: process.env.MONGO_URL || 'mongodb://localhost/vue2-auth'
  })
}));
server.use(flash());
server.use(express.static('public'));
server.use(passport.initialize());
server.use(passport.session());
server.set('views', './views');
server.set('view engine', 'pug');

// Configure passport
passport.use(new LocalStrategy((username, password, done) => {
  const user = getUser(username);

  if (!user || user.password !== password) {
    return done(null, false, {message: 'Username and password combination incorrect.'})
  }

  delete user.password;

  return done(null, user);
}));

// Serialize the current user in the session
passport.serializeUser((user, done) => {
  done(null, user.username);
});

passport.deserializeUser((username, done) => {
  const user = getUser(username);

  delete user.password;

  done(null, user);
});

// Custom middleware functions
function hasScope(scope) {
  return (req, res, next) => {
    const {scopes} = req.user;

    if(!sscopes.includes(scope)) {
      req.flash('error', 'The username and password are not valid.');
      return res.redirect('/');
    }

    return next();
  };
}

function canDelete(req, res, next) {
  const {scopes, username} = req.user;
  const {id} = req.params;
  const exclamation = exclamationData.find(exc => exc.id === id);

  if (!exclamation) {
    return res.sendStatus(404);
  }

  if (exclamation.user !== username && !scopes.includes('delete')) {
    return res.status(403).json({message: 'You can\'t delete that exclamation.'});
  }

  return next();
}

function isAuthenticated(req, res, next) {
  if (!req.user) {
    req.flash('error', 'You must be logged in');
    return res.redirect('/');
  }

  return next();
}