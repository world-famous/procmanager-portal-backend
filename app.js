const express = require('express');
const morgan = require('morgan') // Logging
const path = require('path');
// const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
 const session = require('express-session');
const passport = require('passport');

// const FileStore = require('session-file-store')(session);

var cors = require('cors');

require('./config/passport');

const app = express();

global.appRoot = path.resolve(__dirname);

//app.configure(function() {
app.use(morgan('dev'));

app.set('trust proxy', 1); // trust first proxy

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
// app.use(cookieParser());

/*
app.use(session({
  cookieName: 'session',
  path: "/",
  maxAge: null,
  secret: 'ProcManSecret',
  saveUninitialized: false,
  resave: false
}));
*/
app.use(passport.initialize());
// app.use(passport.session());
//});


app.use((req, res, next) => {
  res.locals.isAuthenticated = req.user ? true : false;
  var allowedOrigins = ['http://portal.procmanager.com', 'https://portal.procmanager.com', 'http://localhost:8080', 'http://localhost:8081', 'http://localhost:8082', 'http://localhost:8083', 'http://localhost:8084', 'http://localhost:8085'];
  var origin = req.headers.origin;
console.log(origin);
  if(allowedOrigins.indexOf(origin) > -1){
       res.setHeader('Access-Control-Allow-Origin', origin);
  }
//  res.setHeader("Access-Control-Allow-Origin", "http://portal.procmanager.com");
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  next();
});

// app.use(cors());

 app.disable('etag');

// app.use('/', require('./routes/index'));
app.use('/user', require('./routes/users'));
app.use('/device', require('./routes/devices'));
app.use('/workorder', require('./routes/workorders'));

app.listen(3130, () => console.log('Server started listening on port 3130!'));
