const mysql = require('mysql2/promise');

const config = require('../config/mysql');

// findById
module.exports.findById = async (id) => {
    try {
// Connect to database
      const connection = await mysql.createConnection({host:'localhost', user: config.MYSQL_USER, password: config.MYSQL_PASSWORD, database: config.MYSQL_DB});

// Find verification entry in table users_not_verified
      return result = await connection.query(`SELECT * FROM devices WHERE id = '${id}'`);
    } catch(error) {
        throw new Error('Error occurred during fetch of user', error);
    }
};


// Register device
module.exports.create = async (email, password, usertype, activated, verificationtoken) => {
    try {
// Connect to database
      const connection = await mysql.createConnection({host:'localhost', user: config.MYSQL_USER, password: config.MYSQL_PASSWORD, database: config.MYSQL_DB});

// Create device in table devices
      const result = await connection.query(`INSERT INTO devices (company_id, external_id, os, imei, phonenumber, active, created_on) VALUES( '${company_id}', '${external_id}','${os}', '${imei}', '${phonenumber}', FALSE, NOW())`);
      let device_id = result.insertId;

      return device_id;
    } catch(error) {
      throw new Error('Error occurred during creation of user', error);
    }
};

// Activate device
module.exports.activate = async (device_id) => {
    try {
// Connect to database
      const connection = await mysql.createConnection({host:'localhost', user: config.MYSQL_USER, password: config.MYSQL_PASSWORD, database: config.MYSQL_DB});

// Find verification entry in table users_not_verified
      const result = await connection.query(`UPDATE devices SET active = TRUE WHERE id = '${device_id}'`);

      return true;
    } catch(error) {
      throw new Error('Error occurred during verification of user', error);
    }
};

// Add app to device
module.exports.addApp = async (device_id, app_id) => {
    try {
// Connect to database
      const connection = await mysql.createConnection({host:'localhost', user: config.MYSQL_USER, password: config.MYSQL_PASSWORD, database: config.MYSQL_DB});

// Find verification entry in table users_not_verified
      const result = await connection.query(`INSERT INTO device_app (app_id, device_id) VALUES ( '${app_id}', '${device_id}' )`);

      return true;
    } catch(error) {
      throw new Error('Error occurred during verification of user', error);
    }
};

