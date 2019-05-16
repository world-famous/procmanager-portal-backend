const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/user');
const jwt  = require('jsonwebtoken');
const BearerStrategy = require('passport-http-bearer').Strategy;

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch(error) {
    done(error, null);
  }
});


passport.use('local', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: false
}, async (email, password, done) => {
    try {
        // 1) Check if the email already exists
        const user = await User.findByEmail( email );
        if (!user) {
            return done(null, false, { message: 'Incorrect User/Password' });
        }

        // 2) Check if the password is correct
        const isValid = await User.comparePasswords(password, user.password);
        if (!isValid) {
            return done(null, false, { message: 'Incorrect User/Password' });
        }
        // 3) Check if email has been verified
        if (!user.verified) {
            return done(null, false, { message: 'Sorry, you must validate email first' });
        }
        return done(null, user);
    } catch(error) {
        return done(null, false, { message: error });
    }
}));

passport.use('mybearer', new BearerStrategy( async (token, cb) => {
  jwt.verify(token, 'mysecretsecret', async (err, decoded) => {
    if (err) return cb(err);
    var user = await User.findById(decoded.id);
    return cb(null, user ? user : false);
  });
}));
