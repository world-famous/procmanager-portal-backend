const express = require('express');
const router = express.Router();
const passport = require('passport');

const Workorder = require('../models/workorder');
const Activity = require('../models/activity');
const User = require('../models/user');
const path = require('path');

function isEmpty(str) {
  return !str || 0 === str.length;
}


router.route('/assign')
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

      const workorderarray = req.body.workorderid;
      const user_id = req.body.user_id;

      const edittedUser = await User.findById(user_id);

      var user_activity = 'Assign Work Orders ';

      workorderarray.forEach((each) => {
        user_activity = user_activity + "<span class=\"badge badge-secondary\">" + each + "</span>&nbsp;&nbsp;";
      });

      user_activity = user_activity + "To User <span class=\"badge badge-secondary\">" + edittedUser.name + "</span>";

      const result = await Workorder.assign(workorderarray, user_id);

      const activity = await Activity.create({
        uid: user.id,
        type: 'edit',
        activity: user_activity
      });

      if (!result) {
        return res.status(500).send({
          status: false
        });
      } else {
        return res.status(200).send({
          status: true
        });
      }

    })(req, res, next);
  });

router.route('/user')
  .get((req, res) => {});

router.route('/all')
  .get(async (req, res) => {

    const workorders = await Workorder.getList('1');
    return res.status(200).send({
      workorder: workorders
    });

  });

router.route('/create')
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

      const workorder = req.body.workorder;

      const new_id = await Workorder.create(workorder);

      const user_activity = "Create Work Order <span class=\"badge badge-secondary\">" + new_id + "</span>";

      const activity = await Activity.create({
        uid: user.id,
        type: 'create',
        activity: user_activity
      });

      if (new_id) {
        return res.status(200).send({
          status: true,
          message: 'Success'
        });
      } else {
        return res.status(500).send({
          status: false,
          message: 'Error'
        });
      }


    })(req, res, next);
  });

router.route('/batchCreate')
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

      const workorders = req.body.batchWorkOrder;
      const workorder = {};

      workorder.app_id = workorders[0];
      workorder.external_id = workorders[1];
      workorder.priority = workorders[2];
      workorder.app_process_id = workorders[3];
      workorder.app_design_id = workorders[4];
      workorder.planned_start = (new Date(workorders[5])).toMysqlFormat();
      workorder.planned_end = (new Date(workorders[6])).toMysqlFormat();
      workorder.short_description = workorders[7];
      workorder.long_description = workorders[8];
      workorder.x_coord = workorders[9];
      workorder.y_coord = workorders[10];
      workorder.country = workorders[11];
      workorder.region = workorders[12];
      workorder.city = workorders[13];
      workorder.suburb = workorders[14];
      workorder.street = workorders[15];
      workorder.house_num = workorders[16];

      const new_id = await Workorder.create(workorder);

      if (new_id) {
        return res.status(200).send({
          status: true,
          message: 'Success',
          workOrderId: new_id
        });
      } else {
        return res.status(200).send({
          status: false,
          message: 'Error'
        });
      }

    })(req, res, next);
  });


router.route('/batchCreatedIds')
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

      const batchCreatedIds = req.body.batchCreatedIds;
      var user_activity = 'Batch Created Work Orders ';

      batchCreatedIds.forEach((each) => {
        user_activity = user_activity + "<span class=\"badge badge-secondary\">" + each + "</span>&nbsp;&nbsp;";
      });

      user_activity = user_activity + " By CSV File Upload";

      const activity = await Activity.create({
        uid: user.id,
        type: 'create',
        activity: user_activity
      });

      if (activity) {
        return res.status(200).send({
          status: true,
          message: 'Success'
        });
      } else {
        return res.status(200).send({
          status: false,
          message: 'Error'
        });
      }

    })(req, res, next);
  });

router.route('/masschange')
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

      const workorderarray = req.body.workorderid;
      const massForm = req.body.massForm;
      
      var user_activity = 'Mass Change Work Orders ';
      const statuses = ['Created', 'Assigned', 'Completed'];

      workorderarray.forEach((each) => {
        user_activity = user_activity + "<span class=\"badge badge-secondary\">" + each + "</span>&nbsp;&nbsp;<br/>";
      });


      if (massForm) {
        if(massForm.priority != null)
          user_activity = user_activity + " Priority As " + "<span class=\"badge badge-secondary\">" + massForm.priority + "</span><br/>";
        if(massForm.selected != null)
          user_activity = user_activity + " Status As " + "<span class=\"badge badge-secondary\">" + statuses[massForm.selected - 1] + "</span><br/>";
        if(massForm.planned_start != null)
          user_activity = user_activity + " Planned Start Date As " + "<span class=\"badge badge-secondary\">" + (new Date(massForm.planned_start)).toLocaleString() + "</span><br/>";
      }

      const result = await Workorder.massChange(workorderarray, massForm);

      const activity = await Activity.create({
        uid: user.id,
        type: 'create',
        activity: user_activity
      });

      if (!result) {
        return res.status(500).send({
          status: false
        });
      }

      return res.status(200).send({
        status: true
      });
    })(req, res, next);

  });

router.route('/detail')
  .post(async (req, res, next) => {
    try {
      const wid = req.body.wid;

      const result = await Workorder.findById(1, wid);
      if (!result) {
        return res.status(500).send({
          status: false
        });
      }
      return res.status(200).send({
        status: true,
        workorder: result[0]
      });

    } catch (error) {
      return res.status(500).send({
        status: false
      });
    }
  });

router.route('/saveRoute')
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

      const uid = user.id;
      const route = req.body.route;
      const routeName = req.body.name;
      const description = req.body.description;

      const route_id = await Workorder.createRoute({
        uid: uid,
        name: routeName,
        route: JSON.stringify(route),
        description: description
      });

      const user_activity = "Created Route " + "<span class=\"badge badge-secondary\">" + routeName + "</span>";
      const activity = await Activity.create({
        uid: uid,
        type: 'create',
        activity: user_activity
      });

      if (route_id) {
        return res.status(200).send({
          status: true,
          message: 'Successfully Created!'
        });
      } else {
        return res.status(500).send({
          status: false,
          message: 'Something went wrong!'
        });
      }

    })(req, res, next);
  });


router.route('/savedRoute')
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

      const uid = user.id;

      const routes = await Workorder.savedRoute(uid);

      if (routes) {
        return res.status(200).send({
          status: true,
          routes: routes
        });
      } else {
        return res.status(500).send({
          status: false,
          message: 'Something went wrong!'
        });
      }

    })(req, res, next);
  });

router.route('/removeRoute')
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

      const route_id = req.body.routeId;
      const route = await Workorder.findByRouteId(route_id);
      const result = await Workorder.removeRoute(route_id);
      const user_activity = "Removed Route " + "<span class=\"badge badge-secondary\">" + route.name + "</span>";
      const activity = await Activity.create({
        uid: user.id,
        type: 'remove',
        activity: user_activity
      });

      if (result) {
        return res.status(200).send({
          status: true,
          message: 'Successfully Removed!'
        });
      } else {
        return res.status(500).send({
          status: false,
          message: 'Something went wrong!'
        });
      }

    })(req, res, next);
  });

router.route('/getWorkOrderHistory')
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

      const wid = req.body.wid;

      const wodh = await Activity.findWorkOrderHistoryByWorkOrderId(wid);

      if (wodh) {
        return res.status(200).send({
          status: true,
          message: 'Success',
          history: wodh
        });
      } else {
        return res.status(500).send({
          status: false,
          message: 'Error'
        });
      }

    })(req, res, next);
  });



router.route('/getStatisticsData')
    .get(async (req, res) => {

    const workorderStatistics = await Workorder.getStatisticsData('1');

    return res.status(200).send({
        workorderStatistics: workorderStatistics
    });

});

function twoDigits(d) {
  if (0 <= d && d < 10) return "0" + d.toString();
  if (-10 < d && d < 0) return "-0" + (-1 * d).toString();
  return d.toString();
}

Date.prototype.toMysqlFormat = function () {
  return this.getUTCFullYear() + "-" + twoDigits(1 + this.getUTCMonth()) + "-" + twoDigits(this.getUTCDate()) + " " + twoDigits(this.getHours()) + ":" + twoDigits(this.getUTCMinutes()) + ":" + twoDigits(this.getUTCSeconds());
};

module.exports = router;