const mysql = require('mysql2/promise');

const config = require('../config/mysql');


module.exports.findByUserId = async (uid) => {
    try {
      const connection = await mysql.createConnection({host:'localhost', user: config.MYSQL_USER, password: config.MYSQL_PASSWORD, database: config.MYSQL_DB});

      const [result] = await connection.query(`SELECT * FROM user_activity WHERE uid = '${uid}'`);
      return result;
      
    } catch(error) {
        throw new Error('Error occurred during fetch of user', error);
    }
};

module.exports.getAllActivity = async () => {
  try {
    const connection = await mysql.createConnection({host:'localhost', user: config.MYSQL_USER, password: config.MYSQL_PASSWORD, database: config.MYSQL_DB});

    const [result] = await connection.query(`SELECT * FROM user_activity WHERE 1 = 1 LIMIT 25`);
    return result;
    
  } catch(error) {
      throw new Error('Error occurred during fetch of user', error);
  }
};

module.exports.findWorkOrderHistoryByWorkOrderId = async (wid) => {
  try {
    const connection = await mysql.createConnection({host:'localhost', user: config.MYSQL_USER, password: config.MYSQL_PASSWORD, database: config.MYSQL_DB});

    const [result] = await connection.query(`SELECT * FROM app_workorder_history WHERE wid = '${wid}'`);
    return result;
    
  } catch(error) {
      throw new Error('Error occurred during fetch of user', error);
  }
};


module.exports.findById = async (id) => {
  try {
    const connection = await mysql.createConnection({host:'localhost', user: config.MYSQL_USER, password: config.MYSQL_PASSWORD, database: config.MYSQL_DB});

    const [result] = await connection.query(`SELECT * FROM user_activity WHERE id = '${id}'`);
    return result[0];
    
  } catch(error) {
      throw new Error('Error occurred during fetch of user', error);
  }
};

module.exports.findWorkOrderHistoryById = async (id) => {
  try {
    const connection = await mysql.createConnection({host:'localhost', user: config.MYSQL_USER, password: config.MYSQL_PASSWORD, database: config.MYSQL_DB});

    const [result] = await connection.query(`SELECT * FROM app_workorder_history WHERE id = '${id}'`);
    return result[0];
    
  } catch(error) {
      throw new Error('Error occurred during fetch of Work Order History', error);
  }
};

module.exports.create = async (body) => {
    try {
        const connection = await mysql.createConnection({host:'localhost', user: config.MYSQL_USER, password: config.MYSQL_PASSWORD, database: config.MYSQL_DB});

        const current = new Date();

        const [result] = await connection.query(`INSERT INTO user_activity (uid, type, activity, time) VALUES('${body.uid}', '${body.type}' ,'${body.activity}', '${current.toMysqlFormat()}')`);

        let activity_id = result.insertId;

        return activity_id;
        
    } catch(err) {
        const connection = await mysql.createConnection({host:'localhost', user: config.MYSQL_USER, password: config.MYSQL_PASSWORD, database: config.MYSQL_DB});
        const result = await connection.query(`ROLLBACK`);
        throw new Error('Error occurred during creation of user activity', error);
    }
}

module.exports.createWorkOrderHistory = async (body) => {
  try {
      const connection = await mysql.createConnection({host:'localhost', user: config.MYSQL_USER, password: config.MYSQL_PASSWORD, database: config.MYSQL_DB});

      const current = new Date();

      const [result] = await connection.query(`INSERT INTO app_workorder_history (wid, type, history, time) VALUES('${body.wid}', '${body.type}' ,'${body.history}', '${current.toMysqlFormat()}')`);

      let history_id = result.insertId;

      return history_id;
      
  } catch(err) {
      const connection = await mysql.createConnection({host:'localhost', user: config.MYSQL_USER, password: config.MYSQL_PASSWORD, database: config.MYSQL_DB});
      const result = await connection.query(`ROLLBACK`);
      throw new Error('Error occurred during creation of workorder_history', error);
  }
}

function twoDigits(d) {
  if(0 <= d && d < 10) return "0" + d.toString();
  if(-10 < d && d < 0) return "-0" + (-1*d).toString();
  return d.toString();
}

Date.prototype.toMysqlFormat = function() {
  return this.getUTCFullYear() + "-" + twoDigits(1 + this.getUTCMonth()) + "-" + twoDigits(this.getUTCDate()) + " " + twoDigits(this.getHours()) + ":" + twoDigits(this.getUTCMinutes()) + ":" + twoDigits(this.getUTCSeconds());
};