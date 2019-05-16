const express = require('express');
const router = express.Router();
const passport = require('passport');
const randomstring = require('randomstring');
const mailer = require('../misc/mailer');
const jwt = require('jsonwebtoken');
const isemail = require('isemail');

const User = require('../models/user');
const Activity = require('../models/activity');

function isEmpty(str) {
  return !str || 0 === str.length;
}

router.route('/register')
  .post(async (req, res, next) => {
    try {
      // check to make sure none of the fields are empty
      if (
        isEmpty(req.body.name) ||
        isEmpty(req.body.email) ||
        isEmpty(req.body.password)
      ) {
        return res.status(500).send({
          status: false,
          message: "All fields are required"
        });
      }

      if (!isemail.validate(req.body.email)) {
        return res.status(400).send({
          status: false,
          message: "Email specified is incorrect"
        });
      }

      // Checking if email is already taken
      const user = await User.findByEmail(req.body.email);
      if (user) {
        return res.status(400).send({
          status: false,
          message: "Email has already been registered"
        });
      }

      // Hash the password
      const hash = await User.hashPassword(req.body.password);

      // Generate verification token
      const verificationToken = randomstring.generate();

      // Check verification token is unique
      const token_exist = await User.verificationexist(verificationToken);
      if (token_exist) {
        return res.status(400).send({
          status: false,
          message: "Not unique token"
        });
      }

      const usertype = '[3]';
      const activated = false;

      const newUser = await User.create(req.body.email, req.body.name, hash, usertype, activated, verificationToken);

      const user_activity = "Register!";
      const activity = await Activity.create({
        uid: newUser,
        type: 'register',
        activity: user_activity
      });

      // Compose email
      const html = `<h1>ProcManager.com</h1>
      <br/>
      <h1>Verify your email address</h1>
      <br/>
      You've created an account with the email address: ${req.body.email}</br>
      Please verify your email by clicking on the link below
      <a href="http://portal.procmanager.com/verify?token=${verificationToken}">http://portal.procmanager.com/verify?token=${verificationToken}</a>
      <br/><br/>
      Process Manager team.`;

      // Send email
      await mailer.sendEmail('no-reply@procmanager.com', req.body.email, 'Please verify your email!', html);

      return res.status(200).send({
        status: true
      });
    } catch (error) {
      return res.status(500).send({
        status: false,
        message: error
      });
    }
  });

router.route('/verify')
  .post(async (req, res, next) => {
    try {
      const verificationtoken = req.body.token;

      // Find account with matching secret token
      const user = await User.verificationexist(verificationtoken);
      if (!user) {
        return res.status(500).send({
          status: false,
          message: 'No user to verify'
        });
      }
      await User.verify(verificationtoken);
      return res.status(200).send({
        status: true
      });

    } catch (error) {
      return res.status(500).send({
        status: false,
        message: error
      });
    }
  });


router.route('/users')
  .get(async (req, res, next) => {
    passport.authenticate('mybearer', {
      session: false
    }, async (err, user, info) => {
      if (err) {
        return res.status(500).send({
          status: false,
          message: err
        });
      }

      if (!user) {
        return res.status(401).send({
          status: false,
          message: 'Not logged in'
        });
      }
      const users = await User.getUsers(1);
      return res.status(200).send({
        users: users
      });
    })(req, res, next);
  });

router.route('/login')
  .post(async (req, res, next) => {
    passport.authenticate('local', function (err, user, info) {

      if (err) {
        return res.status(500).send({
          status: false,
          message: err
        });
      }
      if (!user.id) {
        return res.status(401).send({
          status: false,
          message: 'Failed to login1'
        });
      }
      req.logIn(user, function (err) {
        if (err) {
          return res.status(401).send({
            status: false,
            message: 'Failed to login2'
          });
        }
        const token = jwt.sign(JSON.parse(JSON.stringify(user)), 'mysecretsecret');
        delete user.password;
        return res.json({
          user,
          token
        });
      });
    })(req, res);
  });

router.route('/logout')
  .get((req, res) => {
    //    if(req.isAuthenticated())
    req.logout();
    delete req.session;
    return res.status(200).send({
      status: true
    });
  });

router.route('/editRole')
  .post(async (req, res, next) => {
    passport.authenticate('mybearer', {
      session: false
    }, async (err, user, info) => {
      if (err) {
        return res.status(500).send({
          status: false,
          message: err
        });
      }

      if (!user) {
        return res.status(401).send({
          status: false,
          message: 'Not logged in'
        });
      }

      var new_user_type = '';
      var user_type = [];
      var userTypes = ['Administrator', 'Assigner', 'Field worker'];
      var roleData = req.body.roleData;
      for (var i = 0; i < roleData.length; i++) {
        user_type.push(roleData[i].value);
        new_user_type = new_user_type + userTypes[roleData[i].value - 1] + ' ';
      }



      const editUser = await User.findById(req.body.uid);
      var old_user_type = '';
      JSON.parse(editUser.user_type).forEach((each) => {
        old_user_type = old_user_type + userTypes[roleData[i].value - 1] + ' ';
      });
      editUser.user_type = JSON.stringify(user_type);


      const user_activity = "Editted User Role From" + old_user_type + " To " + new_user_type;
      const activity = await Activity.create({
        uid: user.id,
        type: 'edit',
        activity: user_activity
      });

      const edittedUser = await User.update(req.body.uid, editUser);
      return res.status(200).send({
        user: edittedUser
      });
    })(req, res, next);
  });

router.route('/emailValidate')
  .post(async (req, res, next) => {
    passport.authenticate('mybearer', {
      session: false
    }, async (err, user) => {
      if (err) {
        return res.status(500).send({
          status: false,
          message: err
        });
      }

      if (!user) {
        return res.status(401).send({
          status: false,
          message: 'Not logged in'
        });
      }

      var email = req.body.email;
      const email_exist = await User.emailExist(email);
      if (email_exist) {
        return res.status(200).send({
          status: false,
          message: "Email Exists!"
        });
      } else {
        return res.status(200).send({
          status: true,
          message: "Valid Email!"
        });
      }

    })(req, res, next);
  });

router.route('/createUser')
  .post(async (req, res, next) => {
    passport.authenticate('mybearer', {
      session: false
    }, async (err, user) => {
      if (err) {
        return res.status(500).send({
          status: false,
          message: err
        });
      }

      if (!user) {
        return res.status(401).send({
          status: false,
          message: 'Not logged in'
        });
      }

      const userData = req.body.user;
      var usertype = [];
      var roleData = userData.uRoleValue;
      for (var i = 0; i < roleData.length; i++) {
        usertype.push(roleData[i].value);
      }
      const hash = await User.hashPassword(userData.pass);

      // Generate verification token
      const verificationToken = randomstring.generate();
      const activated = false;
      const newUser = await User.create(userData.email, userData.name, hash, JSON.stringify(usertype), activated, verificationToken);

      const user_activity = "Created User " + "<span class=\"badge badge-secondary\">" + userData.name + "</span>";
      const activity = await Activity.create({
        uid: user.id,
        type: 'create',
        activity: user_activity
      });
      if (newUser) {
        return res.status(200).send({
          status: true,
          message: 'Success!'
        });
      } else {
        return res.status(500).send({
          status: false,
          message: 'Error!'
        });
      }

    })(req, res, next);
  });


router.route('/userDetail')
  .post(async (req, res, next) => {
    passport.authenticate('mybearer', {
      session: false
    }, async (err, user, info) => {
      if (err) {
        return res.status(500).send({
          status: false,
          message: err
        });
      }

      if (!user) {
        return res.status(401).send({
          status: false,
          message: 'Not logged in'
        });
      }
      const userDetail = await User.findById(req.body.uid);
      return res.status(200).send({
        user: userDetail
      });
    })(req, res, next);
  });

router.route('/editUserData')
  .post(async (req, res, next) => {
    passport.authenticate('mybearer', {
      session: false
    }, async (err, user) => {
      if (err) {
        return res.status(500).send({
          status: false,
          message: err
        });
      }

      if (!user) {
        return res.status(401).send({
          status: false,
          message: 'Not logged in'
        });
      }

      const userData = req.body.user;
      const uid = req.body.uid;
      var usertype = [];
      var roleData = userData.roleValue;

      var new_user_type = '';
      var userTypes = ['Administrator', 'Assigner', 'Field worker'];

      for (var i = 0; i < roleData.length; i++) {
        usertype.push(roleData[i].value);
        new_user_type = new_user_type + "<span class=\"badge badge-secondary\">" + userTypes[roleData[i].value - 1] + "</span>";
      }

      const editUser = await User.findById(uid);
      if (uid) {
        var old_user_type = '';

        JSON.parse(editUser.user_type).forEach((each) => {
          old_user_type = old_user_type + "<span class=\"badge badge-secondary\">" + userTypes[each - 1] + "</span>";
        });
        var user_activity = "Editted User Role From " + old_user_type + " To " + new_user_type;
        if (editUser.name != userData.name)
          user_activity = user_activity + '<br/>' + "Editted User Name From " + "<span class=\"badge badge-secondary\">" + editUser.name + "</span>&nbsp;&nbsp;" + " To " + "<span class=\"badge badge-secondary\">" + userData.name + "</span>";
        if (editUser.email != userData.email)
          user_activity = user_activity + '<br/>' + "Editted User Email From " + "<span class=\"badge badge-secondary\">" + editUser.email + "</span>&nbsp;&nbsp;" + " To " + "<span class=\"badge badge-secondary\">" + userData.email + "</span>";
        const edittedUser = await User.update(uid, {
          email: userData.email,
          user_type: JSON.stringify(usertype),
          name: userData.name
        });
        const activity = await Activity.create({
          uid: user.id,
          type: 'edit',
          activity: user_activity
        });
        if (edittedUser) {
          return res.status(200).send({
            status: true,
            message: 'Success!'
          });
        } else {
          return res.status(200).send({
            status: false,
            message: 'Error!'
          });
        }
      } else {
        return res.status(200).send({
          status: false,
          message: 'Error!'
        });
      }
    })(req, res, next);
  });

router.route('/changepassword')
  .post(async (req, res, next) => {
    passport.authenticate('mybearer', {
      session: false
    }, async (err, user) => {
      if (err) {
        return res.status(500).send({
          status: false,
          message: err
        });
      }

      if (!user) {
        return res.status(401).send({
          status: false,
          message: 'Not logged in'
        });
      }

      const passData = req.body.password;
      const uid = req.body.uid;

      const editUser = await User.findById(uid);
      if (await User.comparePasswords(passData.oPass, editUser.password)) {
        const newPass = await User.hashPassword(passData.nPass);
        const edittedUser = await User.changePassword(uid, newPass);

        const user_activity = "<span class=\"badge badge-secondary\">" + editUser.name + "</span>" + "`s password changed";

        const activity = await Activity.create({
          uid: user.id,
          type: 'edit',
          activity: user_activity
        });

        if (edittedUser) {
          return res.status(200).send({
            status: true,
            message: 'Success!'
          });
        } else {
          return res.status(200).send({
            status: false,
            message: 'Error!'
          });
        }
      } else {
        return res.status(200).send({
          status: false,
          message: 'Error!'
        });
      }

    })(req, res, next);
  });

router.route('/activities')
  .get(async (req, res, next) => {
    passport.authenticate('mybearer', {
      session: false
    }, async (err, user, info) => {
      if (err) {
        return res.status(500).send({
          status: false,
          message: err
        });
      }

      if (!user) {
        return res.status(401).send({
          status: false,
          message: 'Not logged in'
        });
      }
      const activities = await Activity.getAllActivity();
      return res.status(200).send({
        activities: activities
      });
    })(req, res, next);
  });

  router.route('/activitiesByUser')
  .post(async (req, res, next) => {
    passport.authenticate('mybearer', {
      session: false
    }, async (err, user, info) => {
      if (err) {
        return res.status(500).send({
          status: false,
          message: err
        });
      }

      if (!user) {
        return res.status(401).send({
          status: false,
          message: 'Not logged in'
        });
      }

      const uid = req.body.uid;
      const activities = await Activity.findByUserId(uid);
      return res.status(200).send({
        activities: activities
      });
    })(req, res, next);
  });


module.exports = router;