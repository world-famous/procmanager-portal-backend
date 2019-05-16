const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const config = require('../config/mysql');
const WorkOrderHistory = require('./activity');
const User = require('./user');

// findById
module.exports.findById = async (app_id, id) => {
    try {
// Connect to database
      const connection = await mysql.createConnection({host:'localhost', user: config.MYSQL_USER, password: config.MYSQL_PASSWORD, database: config.MYSQL_DB});

// Find work order by id
      return result = await connection.query(`SELECT * FROM app_workorder WHERE app_id = '${app_id}' AND id = '${id}'`);
    } catch(error) {
        throw new Error('Error occurred during fetch of user', error);
    }
};

// Get work order list
module.exports.getList = async (app_id) => {
    try {
// Connect to database
      const connection = await mysql.createConnection({host:'localhost', user: config.MYSQL_USER, password: config.MYSQL_PASSWORD, database: config.MYSQL_DB});

// Find work order by id
        const sql = `SELECT * FROM app_workorder WHERE app_id = '${app_id}' `;
      const [rows] = await connection.query(sql);
      connection.end();
      return rows;
    } catch(error) {
        throw new Error('Error occurred during fetch of user', error);
    }
};

// findByExternalId
module.exports.findByExternalId = async (app_id, external_id) => {
    try {
// Connect to database
      const connection = await mysql.createConnection({host:'localhost', user: config.MYSQL_USER, password: config.MYSQL_PASSWORD, database: config.MYSQL_DB});

// Find verification entry in table users_not_verified
      return result = await connection.query(`SELECT * FROM app_workorder WHERE app_id = '${app_id}' AND external_id = '${email}'`);
    } catch(error) {
        throw new Error('Error occurred during fetch of user', error);
    }
};

// Create work order
module.exports.create = async (body) => {
    try {
// Connect to database
      const connection = await mysql.createConnection({host:'localhost', user: config.MYSQL_USER, password: config.MYSQL_PASSWORD, database: config.MYSQL_DB});
      const current_time = new Date();

// Create user in table users
      const [result] = await connection.query(`INSERT INTO app_workorder (app_id, external_id, priority, app_process_id, app_design_id, planned_start, planned_end, short_description, long_description, x_coord, y_coord, country, region, city, suburb, street, house_num, status, created_on, changed_on) 
        VALUES( '${body.app_id}', '${body.external_id}','${body.priority}', '${body.app_process_id}', '${body.app_design_id}', '${body.planned_start}', '${body.planned_end}','${body.short_description}', '${body.long_description}', '${body.x_coord}', '${body.y_coord}', '${body.country}', '${body.region}', '${body.city}', '${body.suburb}', '${body.street}', '${body.house_num}', 1, '${current_time.toMysqlFormat()}', '${current_time.toMysqlFormat()}')`);

      let workorder_id = result.insertId;

      var workorder_history = 'Work Order Created';

      const new_workorder_history = await WorkOrderHistory.createWorkOrderHistory({
        wid: workorder_id,
        type: 'create',
        history: workorder_history
      });

      return workorder_id;
    } catch(error) {
// Rollback work
      const connection = await mysql.createConnection({host:'localhost', user: config.MYSQL_USER, password: config.MYSQL_PASSWORD, database: config.MYSQL_DB});  
      const result = await connection.query(`ROLLBACK`);
      throw new Error('Error occurred during creation of work order', error);
    }
};

// Assign work order
module.exports.assign = async (id, user_id) => {
    try {
const userid = user_id;
// Connect to database
      const connection = await mysql.createConnection({host:'localhost', user: config.MYSQL_USER, password: config.MYSQL_PASSWORD, database: config.MYSQL_DB});
//       await id.forEach( async (wo_id) => {
// // Update work order with assigned_to
//         const result = await connection.query(`UPDATE app_workorder SET assigned_to = '${userid}', status = 2 WHERE id = '${wo_id}'`);
//       });

      const user = await User.findById(userid);
      var workorder_history = 'Work Order Assigned To User <span class=\"badge badge-secondary\">' + user.name + "</span>";

      for( var i = 0; i < id.length ; i++ ){
        const result = await connection.query(`UPDATE app_workorder SET assigned_to = '${userid}', status = 2 WHERE id = '${id[i]}'`);

        var new_workorder_history = await WorkOrderHistory.createWorkOrderHistory({
          wid: id[i],
          type: 'edit',
          history: workorder_history
        });
      }

      return true;
    } catch(error) {
      throw new Error('Error occurred during verification of user', error);
    }
};

module.exports.massChange = async (ids,body) => {
    try {
        var connection = await mysql.createConnection({host:'localhost', user: config.MYSQL_USER, password: config.MYSQL_PASSWORD, database: config.MYSQL_DB});

        
        var statuses = ['Created', 'Assigned', 'Completed'];
        
        await ids.forEach( async (wo_id) => {
          var workorder_history = "Mass Changed ";
          const wo = await connection.query(`SELECT * FROM app_workorder WHERE app_id = '${1}' AND id = '${wo_id}'`);
          
          var priority = wo[0][0].priority;
          var status = wo[0][0].status;
          var planned_start = wo[0][0].planned_start;
          var result = null;
          connection = await mysql.createConnection({host:'localhost', user: config.MYSQL_USER, password: config.MYSQL_PASSWORD, database: config.MYSQL_DB});
          if(body.priority != null && priority != body.priority) {
            workorder_history = workorder_history + " Priority Changed From <span class=\"badge badge-secondary\">" + priority + "</span> To <span class=\"badge badge-secondary\">" +  body.priority + "</span> <br/>";
            result = await connection.query(`UPDATE app_workorder SET priority = '${body.priority}' WHERE id = '${wo_id}'`);
          } 
          if (body.selected != null && status != body.selected) {
            workorder_history = workorder_history + " Status Changed From <span class=\"badge badge-secondary\">" + statuses[status - 1] + "</span> To <span class=\"badge badge-secondary\">" +  statuses[body.selected - 1] + "</span><br/>";
            result = await connection.query(`UPDATE app_workorder SET status = '${body.selected}' WHERE id = '${wo_id}'`);
          } 
          if (body.planned_start != null && (new Date(planned_start)).toLocaleString() != (new Date(body.planned_start)).toLocaleString()) {
            workorder_history = workorder_history + " Planned Start Date Changed From <span class=\"badge badge-secondary\">" + (new Date(planned_start)).toLocaleString() + "</span> To <span class=\"badge badge-secondary\">" +  (new Date(body.planned_start)).toLocaleString() + "</span><br/>";
            result = await connection.query(`UPDATE app_workorder SET planned_start='${body.planned_start}' WHERE id = '${wo_id}'`);
          }

          var new_workorder_history = await WorkOrderHistory.createWorkOrderHistory({
            wid: wo_id,
            type: 'edit',
            history: workorder_history
          });

        });

        connection.end();
        return true;
    } catch(err) {
        throw new Error('Error occurred during verification of user', error);
    }
}

module.exports.createRoute = async (body) => {
    try {
        const connection = await mysql.createConnection({host:'localhost', user: config.MYSQL_USER, password: config.MYSQL_PASSWORD, database: config.MYSQL_DB});

        const [result] = await connection.query(`INSERT INTO workorder_route (name, uid, route, description) VALUES('${body.name}', '${body.uid}', '${body.route}', '${body.description}')`);

        let route_id = result.insertId;

        return route_id;
        
    } catch(err) {
        const result = await connection.query(`ROLLBACK`);
        throw new Error('Error occurred during creation of workorder_route', error);
    }
}

module.exports.findByRouteId = async (id) => {
    try {
// Connect to database
      const connection = await mysql.createConnection({host:'localhost', user: config.MYSQL_USER, password: config.MYSQL_PASSWORD, database: config.MYSQL_DB});

// Find work order by id
      const [result] = await connection.query(`SELECT * FROM workorder_route WHERE id = '${id}'`);

      return result[0];
    } catch(error) {
        throw new Error('Error occurred during fetch of user', error);
    }
};

module.exports.savedRoute = async (uid) => {
    try {
        const connection = await mysql.createConnection({host:'localhost', user: config.MYSQL_USER, password: config.MYSQL_PASSWORD, database: config.MYSQL_DB});

        const sql = `SELECT * FROM workorder_route WHERE uid = '${uid}' `;

        const [rows] = await connection.query(sql);

        return rows;
    } catch(error) {
        throw new Error('Error occurred during fetch of workorder_route', error);
    }
};

module.exports.removeRoute = async (routeId) => {
    try {
        const connection = await mysql.createConnection({host:'localhost', user: config.MYSQL_USER, password: config.MYSQL_PASSWORD, database: config.MYSQL_DB});

        const result = await connection.query(`DELETE FROM workorder_route WHERE id = '${routeId}'`);

        return result;
    } catch(error) {
        throw new Error('Error occurred during fetch of workorder_route', error);
    }
};

module.exports.getStatisticsData = async (app_id) => {
    try {
// Connect to database
        const connection = await mysql.createConnection({host:'localhost', user: config.MYSQL_USER, password: config.MYSQL_PASSWORD, database: config.MYSQL_DB});

        var sql = `SELECT count(*) as total FROM app_workorder WHERE app_id = '${app_id}' AND status = 1`;
        const [unassigned] = await connection.query(sql);


        sql = `SELECT count(*) as total FROM app_workorder WHERE app_id = '${app_id}' AND status = 2`;
        const [assigned] = await connection.query(sql);

        sql = `SELECT count(*) as total FROM app_workorder WHERE app_id = '${app_id}' AND status = 3`;
        const [completed] = await connection.query(sql);

        var unassignedYearData = [], completedYearData = [];

        var currentYear = new Date().getFullYear();

        for(var mm = 0; mm <12 ; mm++) {
            sql = `SELECT count(*) as total FROM app_workorder WHERE app_id = '${app_id}' AND status = 1 AND MONTH(created_on) = '${mm+1}' AND YEAR(created_on) = '${currentYear}'`;

            var [count] = await connection.query(sql);
            unassignedYearData[mm] = count[0].total;

            sql = `SELECT count(*) as total FROM app_workorder WHERE app_id = '${app_id}' AND status = 3 AND MONTH(created_on) = '${mm+1}' AND YEAR(created_on) = '${currentYear}'`;
            var [count] = await connection.query(sql);
            completedYearData[mm] = count[0].total;
        }

        var result = {unassignedData: unassigned[0].total, assignedData: assigned[0].total, completedData: completed[0].total, unassignedYearData: unassignedYearData, completedYearData: completedYearData};

        connection.end();
        return result;
    } catch(error) {
        throw new Error('Error occurred during fetch of user', error);
    }
};

function twoDigits(d) {
    if(0 <= d && d < 10) return "0" + d.toString();
    if(-10 < d && d < 0) return "-0" + (-1*d).toString();
    return d.toString();
  }
  
  Date.prototype.toMysqlFormat = function() {
    return this.getUTCFullYear() + "-" + twoDigits(1 + this.getUTCMonth()) + "-" + twoDigits(this.getUTCDate()) + " " + twoDigits(this.getHours()) + ":" + twoDigits(this.getUTCMinutes()) + ":" + twoDigits(this.getUTCSeconds());
  };
