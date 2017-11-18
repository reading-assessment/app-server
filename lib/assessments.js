var firebase = require('firebase-admin');

exports.getReleventAssessment = (req, res) => {
  //Fetch function
  firebase.database().ref(`assessments/-k1`).once('value')
  .then(function(snapshot){
    if (snapshot.val()){
      console.log(snapshot.val());
    }
    res.send('Fetching Assessment');
  })
}

exports.updateReleventAssessment = (req, res) => {
  //Update Function
  firebase.database().ref(`-k1`).update({ assessment20: 'This is assessment 20'});
  res.send('Updated Assessment');
}

exports.deleteReleventAssessment = (req, res) => {
  //Delete Function
  // firebase.database().ref(`assessments`).set(null);
  res.send('Deleted Assessment');
}

exports.getAssessmentThroughSort = (req, res) => {
  firebase.database().ref('/assessments/').orderByChild('name').equalTo('one').once('value')
  .then(function(snapshot){
    if(snapshot.val()) {
      console.log(snapshot.val());
    }
  });
  res.send('Fetch Sorted Assessment');
}

exports.pushReleventAssessment = (req, res) => {
  //Update Function
  firebase.database().ref(`assessments`).push({ name: 'one'});
  res.send('Push Assessment');
}