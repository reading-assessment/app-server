/******************         Node/Express Setup            ****************/
var fs = require('fs');
var express = require('express');
var app = express();
var cors = require('cors');
var bodyParser = require("body-parser");
var https = require('https');
// socket.io-stream for managein binary streams on client and server
var ss = require('socket.io-stream');
// shell for managing shell command lines, specifically for sox to convert audio to falc
var shell = require('shelljs');
// set the server as a client to send socket to the file to text server
const URL_TEXT_SERVER = 'https://165.227.174.222:9006';
// client side code for socket.io
var ioAsClient = require('socket.io-client');
//required key and cert for https, currently individual key from ioannis, there will be a browser warning for this
var options = {
  key: fs.readFileSync('./thesis-selfsignedkey.pem'),
  cert: fs.readFileSync('./thesis-selfsignedcrt.pem')
};
var serverPort = 9005;
var server = https.createServer(options, app);

/*************************  Firebase Admin  **************************/
var admin = require("firebase-admin");

var serviceAccount = require("./key/benkyohr-e00dc-firebase-adminsdk-125v5-d1fdc86be0.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://benkyohr-e00dc.firebaseio.com"
});

/*********************Firebase End*****************************/

/***************Socketio connection code**********************/
//socket.io requirement and initialization
var ioAsServer = require('socket.io')(server);

ioAsServer.on('connection', function(socketAsServer){
  
  console.log('new connection');
  // socket.io-stream event listening from the client
  ss(socketAsServer).on('client-stream-request', function(stream, objMetaData, aknowledgeFn){
    // node filestream to save file on server filesystem
    var d = new Date();
    const filePrefix = objMetaData.studentName + 'TT' + d.getTime();
    const fileNameWAV = filePrefix + '.wav';
    const filePathWAV = `./audio_files/${fileNameWAV}`;
    const fileNameFLAC = filePrefix + '.flac';
    const filePathFLAC = `./audio_files/${fileNameFLAC}`;
    const fileNameTXT = filePrefix + '.txt';
    const filePathTXT = `./transcribed_files/${fileNameTXT}`;
    //console.log(fileName);
    var writeStream = fs.createWriteStream(filePathWAV);
    stream.pipe(writeStream);
    // when stream of file is completed
    stream.on('end', ()=>{
      // close the client stream by calling the aknowledge function, see code on index.html
      aknowledgeFn(true);
      // turn the wav file on file system to flac file
      shell.exec(`sox ${filePathWAV} --channels=1 --bits=16 --rate=16000 ${filePathFLAC} --norm`, {async:false});
      //shell.exec(`sox maria.wav --channels=1 --bits=16 --rate=16000 maria.flac --norm`, {async:false})
      // remove file from file system
      shell.rm(filePathWAV);
      //-----------app-server stream request to text-server--------------
      var socketioStreamToTextServer = ss.createStream();
      // the parameters of the connect function are required ton run under https
      var socketAsClient = ioAsClient.connect(URL_TEXT_SERVER, {secure: true, reconnect: true, rejectUnauthorized : false });
      // socketio-client requires that we listen to the connect event in order to inittiate anything
      socketAsClient.on('connect', () =>{
        // emit the flac file as stream along with the file name      
        ss(socketAsClient).emit('appserver-stream-request', socketioStreamToTextServer, {fileNameFLAC});
        //fs.createReadStream('maria.flac').pipe(socketioStreamToTextServer);
        fs.createReadStream(filePathFLAC).pipe(socketioStreamToTextServer);
        // listen to the event that fires when text comes back from text server and store the transcribed text
        socketAsClient.on('textserver-transcribebtext', (transcribedTextObj, aknFn)=>{
          var transcribebtext = transcribedTextObj.transcribedText;
          // close the text-server text socket by calling the akn (aknowledge) function, see server code
          aknFn(true);
          // store the transcribed text to a file
          fs.writeFile(filePathTXT, transcribebtext, (err) => {
            if (err) {
              console.log(err);
              return;
            }
            console.log('file ' + fileNameTXT + ' written to transcribed_files directory');
            // console.log(transcribedTextObj.transcribedText);
          });
        });
      });

      //------------------------------------------------------------------
    });
  });
});

/***************Socketio connection code end**********************/

app.use(cors());
app.use(bodyParser.json()); // <--- Here
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/transcribed_files'));
// app.set('port', (process.env.PORT || 3000));
// app.listen(app.get('port'), function() {
//   console.log('Node app is running on port', app.get('port'));
// });

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
app.get('/student/sendData', Students.sendTranscribedAssessment);


server.listen(serverPort, function(){
  console.log('HTTPS server up and running at %s port', serverPort);
});