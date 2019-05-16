const express = require('express');
const router = express.Router();
const passport = require('passport');

const Device = require('../models/device');

function isEmpty(str) {
  return !str || 0 === str.length;
}

router.route('/register')
  .post(async (req, res, next) => {
    try {
      // check to make sure none of the fields are empty
      if (
        isEmpty(req.body.device_extid) ||
        isEmpty(req.body.email)
      ) {
        return res.status(500).send({
          status: false,
          message: "All fields are required"
        });
      }

      // Checking if email is already taken
      const user = await Device.findByEmail( req.body.email );
      if (!user) {        return res.status(500).send({
          status: false,
          message: "Email not registered"
        });
      }

      await Device.register( device_id );

      return res.json({
        status: true
      });
    } catch(error) {
      return res.status(500).send({
        status: false,
        message: error
      });
    }
  });

router.route('/activate')
  .post(async (req, res, next) => {
    try {

// User must be logged in, check authorization for user 

      const device_id = req.body.device_id;

      // Check user is authorized to activate device

      await Device.activate( device_id );      return res.json({
        status: true
      });
    } catch(error) {
      return res.status(500).send({
        status: false,
        message: error
      });
    }
  });

module.exports = router;