var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const cors = require('cors');
const PORT = process.env.PORT || 3000;
require('dotenv').config();

// var indexRouter = require('./routes/index');
// var usersRouter = require('./routes/users');
const teacherRoutes = require('./routes/teacher.route');
const classRoutes = require('./routes/class.route');
const studentRoutes = require('./routes/student.route');
const subjectRoutes = require('./routes/subject.route');
const attendanceRoutes = require('./routes/attendance.route');
const authRoutes = require('./routes/auth.route');
const reportRoutes = require('./routes/report.route');


var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// app.use('/', indexRouter);
// app.use('/users', usersRouter);
app.use('/api/v1/class', classRoutes);
app.use('/api/v1/student', studentRoutes);
app.use('/api/v1/teacher', teacherRoutes);
app.use('/api/v1/subject', subjectRoutes);
app.use('/api/v1/attendance', attendanceRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/report', reportRoutes);

// catch 404 and forward to error handler
// app.use(function(req, res, next) {
//   next(createError(404));
// });

// error handler
// app.use(function(err, req, res, next) {
//   // set locals, only providing error in development
//   res.locals.message = err.message;
//   res.locals.error = req.app.get('env') === 'development' ? err : {};

//   // render the error page
//   res.status(err.status || 500);
//   res.render('error');
// });

// app.use('/api/teacher', teacherRoutes);

app.listen(PORT, () => {
  console.log(`server running on http://localhost:${PORT}`);
});

module.exports = app;
