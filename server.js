/******************         Node/Express Setup            ****************/
var express = require('express');
var app = express();
var cors = require('cors');
var bodyParser = require("body-parser");

/*************************  Firebase Admin  **************************/
var admin = require("firebase-admin");

var serviceAccount = require("./key/benkyohr-e00dc-firebase-adminsdk-125v5-d1fdc86be0.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://benkyohr-e00dc.firebaseio.com"
});

/*********************Firebase End*****************************/

app.use(cors());
app.use(bodyParser.json()); // <--- Here
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('public'));
app.set('port', (process.env.PORT || 3000));
app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});

/************************** Importing Files/Fucntions ******************/
var Users = require("./lib/user");
var Assessments = require("./lib/assessments");
var Classroom = require("./lib/classroom");
var Students = require("./lib/student");

/***************************** Routes ****************************/
app.use("/", express.static(__dirname));
app.get('/assessment/get', Assessments.getReleventAssessment)
app.get('/assessment/update', Assessments.updateReleventAssessment)
app.get('/assessment/getSortedData', Assessments.getAssessmentThroughSort)
app.get('/assessment/pushData', Assessments.pushReleventAssessment)
// app.get('/assessment/delete', Assessments.deleteReleventAssessment)


app.all('/teacher/getToken', Classroom.getGoogleClassOAuthToken);
app.all('/teacher/importClassroom', Classroom.getGoogleClassRoomData);

/***************************** Student Routes ****************************/
 app.get('/student/sendData', Students.sendTranscribedAssessment)