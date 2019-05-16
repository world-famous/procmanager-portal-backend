const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

const config = require('../config/mysql');

// findById
module.exports.findById = async (id) => {
    try {
// Connect to database
      const connection = await mysql.createConnection({host:'localhost', user: config.MYSQL_USER, password: config.MYSQL_PASSWORD, database: config.MYSQL_DB});

// Find verification entry in table users_not_verified
      const [rows] = await connection.query(`SELECT * FROM users WHERE id = '${id}'`);
      return rows[0];
    } catch(error) {
        throw new Error('Error occurred during fetch of user', error);
    }
};

// findByEmail
module.exports.findByEmail = async (email) => {
    try {
// Connect to database
      const connection = await mysql.createConnection({host:'localhost', user: config.MYSQL_USER, password: config.MYSQL_PASSWORD, database: config.MYSQL_DB});

// Find verification entry in table users_not_verified
      const [rows] = await connection.query(`SELECT * FROM users WHERE email = '${email}'`);
      return rows[0];
    } catch(error) {
        throw new Error('Error occurred during fetch of user');
    }
};

// Create user
module.exports.create = async (email, name, password, usertype, verified, verificationtoken) => {
    try {
// Connect to database
      const connection = await mysql.createConnection({host:'localhost', user: config.MYSQL_USER, password: config.MYSQL_PASSWORD, database: config.MYSQL_DB});

// Create transaction
      await connection.query(`START TRANSACTION`);

// Create user in table users
      const [result] = await connection.query(`INSERT INTO users(user_type, email, name, password, verified) VALUES( '${usertype}', '${email}', '${name}', '${password}', '${verified}')`);
      let user_id = result.insertId;
// Add verification token in table users_not_verified
      await connection.query(`INSERT INTO users_not_verified(user_id, verification_token) VALUES( '${user_id}', '${verificationtoken}')`);

// Commit work
      await connection.query(`COMMIT`);

      return user_id;
    } catch(error) {
// Rollback work
      const connection = await mysql.createConnection({host:'localhost', user: config.MYSQL_USER, password: config.MYSQL_PASSWORD, database: config.MYSQL_DB});
      await connection.query(`ROLLBACK`);
      throw new Error('Error occurred during creation of user', error);
    }
};

// Verify user
module.exports.verify = async (verificationtoken) => {
    try {
// Connect to database
      const connection = await mysql.createConnection({host:'localhost', user: config.MYSQL_USER, password: config.MYSQL_PASSWORD, database: config.MYSQL_DB});

// Create transaction
      await connection.query(`START TRANSACTION`);

// Find verification entry in table users_not_verified
      const [rows] = await connection.query(`SELECT * FROM users_not_verified WHERE verification_token = '${verificationtoken}'`);
      if(rows.length !== 0) {
// Update user as verified
        const user_id = rows[0].user_id;
        const result1 = await connection.query(`UPDATE users SET verified = true WHERE id = '${user_id}'`);
// Remove verification token from table users_not_verified
        const result2 = await connection.query(`DELETE FROM users_not_verified WHERE user_id = '${user_id}'`);

// Commit work
      await connection.query(`COMMIT`);

      }

      return new Promise( function(resolve, reject){ resolve("Ok"); });
    } catch(error) {
// Rollback work
      const connection = await mysql.createConnection({host:'localhost', user: config.MYSQL_USER, password: config.MYSQL_PASSWORD, database: config.MYSQL_DB});
      await connection.query(`ROLLBACK`);
      throw new Error('Error occurred during verification of user', error);
    }
};

// Verify user
module.exports.verificationexist = async (verificationtoken) => {
    try {
// Connect to database
      const connection = await mysql.createConnection({host:'localhost', user: config.MYSQL_USER, password: config.MYSQL_PASSWORD, database: config.MYSQL_DB});

// Find verification entry in table users_not_verified
      const [rows] = await connection.query(`SELECT * FROM users_not_verified WHERE verification_token = '${verificationtoken}'`);
      return rows[0];
    } catch(error) {
        throw new Error('Error occurred during fetch of user', error);
    }
};

// Get users
module.exports.getUsers = async (company_id) => {
    try {
// Connect to database
      const connection = await mysql.createConnection({host:'localhost', user: config.MYSQL_USER, password: config.MYSQL_PASSWORD, database: config.MYSQL_DB});

// Find verification entry in table users_not_verified
      const [rows] = await connection.query(`SELECT id, name, user_type, email, verified, active FROM users`);
      return rows;
    } catch(error) {
        throw new Error('Error occurred during fetch of user', error);
    }
};

module.exports.hashPassword = async (password) => {
    try {
        const salt = await bcrypt.genSalt(10);
        return await bcrypt.hash(password, salt);
    } catch(error) {
        throw new Error('Hashing failed', error);
    }
};
module.exports.comparePasswords = async (inputPassword, hashedPassword) => {
    try {
        const same = await bcrypt.compare(inputPassword, hashedPassword);
        return same;
    } catch(error) {
        throw new Error('Comparing failed', error);
    }
};

module.exports.changePassword = async (uid, password) => {
    try {
        const connection = await mysql.createConnection({host:'localhost', user: config.MYSQL_USER, password: config.MYSQL_PASSWORD, database: config.MYSQL_DB});
        const result = await connection.query(`UPDATE users SET password = '${password}' WHERE id = '${uid}'`);
        if(result) {
            const [rows] = await connection.query(`SELECT id, name, user_type, email FROM users WHERE id = '${uid}'`);
            return rows[0];
        }
    } catch(error) {
        throw new Error('Error occurred during fetch of user', error);
    }
}

module.exports.update = async (uid, body) => {
    try {
        const connection = await mysql.createConnection({host:'localhost', user: config.MYSQL_USER, password: config.MYSQL_PASSWORD, database: config.MYSQL_DB});
        const result = await connection.query(`UPDATE users SET ? WHERE id = '${uid}'`, [{username: body.username, email: body.email, user_type: body.user_type, name: body.name}]);
        if(result) {
            const [rows] = await connection.query(`SELECT id, name, user_type, email FROM users WHERE id = '${uid}'`);
            return rows[0];
        }
    } catch(error) {
        throw new Error('Error occurred during fetch of user', error);
    }
};

module.exports.emailExist = async (email) => {
    try {
// Connect to database
      const connection = await mysql.createConnection({host:'localhost', user: config.MYSQL_USER, password: config.MYSQL_PASSWORD, database: config.MYSQL_DB});

// Find verification entry in table users_not_verified
      const [rows] = await connection.query(`SELECT * FROM users WHERE email = '${email}'`);
      return rows[0];
    } catch(error) {
        throw new Error('Error occurred during fetch of user', error);
    }
};
