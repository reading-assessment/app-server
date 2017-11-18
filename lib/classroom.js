var fs = require('fs');
var readline = require('readline');
var google = require('googleapis');
var googleAuth = require('google-auth-library');
var axios = require('axios');
var firebase = require('firebase-admin');
// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/classroom.googleapis.com-nodejs-quickstart.json
var SCOPES = [
              'https://www.googleapis.com/auth/classroom.rosters',
              'https://www.googleapis.com/auth/classroom.rosters.readonly',
              'https://www.googleapis.com/auth/classroom.courses',
              'https://www.googleapis.com/auth/classroom.courses.readonly',
              'https://www.googleapis.com/auth/classroom.profile.emails',
              'https://www.googleapis.com/auth/classroom.profile.photos'
            ];
var TOKEN_DIR = './.credentials/';
var TOKEN_PATH = TOKEN_DIR + 'classroom.googleapis.com-nodejs-quickstart.json';

var current_uid = null;
var oauth2Client = null;

exports.getGoogleClassOAuthToken = (req, res) => {
  console.log('Logged in as: ', req.query.uid);
  current_uid = req.query.uid;
  // Load client secrets from a local file.
  fs.readFile('./key/client_secret_962820534326-1nn3i1aloh1q1seo5c1bi0rhtd0vrmsu.apps.googleusercontent.com.json', function processClientSecrets(err, content) {
    if (err) {
      console.log('Error loading client secret file: ' + err);
      return;
    }
    // Authorize a client with the loaded credentials, then call the
    // Classroom API.
    authorize(JSON.parse(content), res, listCourses);
  });
}

exports.getGoogleClassRoomData = (req, res) => {
  console.log('getGoogleClassRoomData');
  if (req.query.code){
    oauth2Client.getToken(req.query.code, function(err, token) {
      if (err) {
        console.log('Error while trying to retrieve access token', err);
        res.status(500).send(err);
        return;
      }
      oauth2Client.credentials = token;
      storeToken(token);
      listCourses(oauth2Client);
    });
  } else {
    res.status(500).send('Something went wrong in Authentication');
  }
  res.send('Getting Google Classroom Data');
}


/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, res, callback) {
  var clientSecret = credentials.installed.client_secret;
  var clientId = credentials.installed.client_id;
  var redirectUrl = credentials.installed.redirect_uris[0];
  var auth = new googleAuth();
  oauth2Client = new auth.OAuth2(clientId, clientSecret, 'http://127.0.0.1:3000/teacher/importClassroom');

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, function(err, token) {
    if (err) {
      getNewToken(oauth2Client, res, callback);
    } else {
      oauth2Client.credentials = JSON.parse(token);
      callback(oauth2Client);
    }
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */
function getNewToken(oauth2Client, res) {
  var authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  });
  console.log('Redirecting to: ', authUrl);
  res.redirect(authUrl);
}

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
function storeToken(token) {
  try {
    fs.mkdirSync(TOKEN_DIR);
  } catch (err) {
    if (err.code != 'EEXIST') {
      throw err;
    }
  }
  fs.writeFile(TOKEN_PATH, JSON.stringify(token));
  console.log('Token stored to ' + TOKEN_PATH);
}


/**
 * Lists the first 10 courses the user has access to.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listCourses(auth) {
  var classroom = google.classroom('v1');
  classroom.courses.list({
    auth: auth,
    pageSize: 10
  }, function(err, response) {
    if (err) {
      console.log('The API returned an error: ' + err);
      return;
    }
    var courses = response.courses;
    if (!courses || courses.length == 0) {
      console.log('No courses found.');
    } else {
      for (var i = 0; i < courses.length; i++) {
        var course = courses[i];
        console.log('Course: ', course.name);
        listStudents(auth, course);
      }
    }
  }.bind(this));
}

//classroom number is 9318076367
function listStudents(auth, course) {
  var classroom = google.classroom('v1');
  classroom.courses.students.list({
    auth: auth,
    courseId: course.id,
    pageSize: 10
  }, function(err, response) {
    if (err) {
      console.log('The API returned an error: ' + err);
      return;
    }
    var students = response.students;
    if (!students || students.length == 0) {
      console.log('No students found.');
    } else {
      for (var i = 0; i < students.length; i++) {
        var student = students[i];
        student.course = course;
        firebase.database().ref(`/classes/${current_uid}/students/${student.userId}`).update(student);
      }
    }
  }.bind(this));
}