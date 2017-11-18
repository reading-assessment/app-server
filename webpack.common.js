const path = require('path');

var firebase = require("firebase/app");
require("firebase/auth");
require("firebase/database");
require("firebase/firestore");

module.exports = {
  entry:  [
            './src/components/App.jsx',
            './src/components/NavigationHeader.jsx',
            './src/components/Teachers/Login/TeacherLogin.jsx',
            './src/components/Teachers/TeacherDashboard.jsx',
            './src/components/Students/Login/StudentLogin.jsx',
            './src/components/Students/StudentDashboard.jsx',
            './src/index.js'
          ],
  output: {
    filename: 'bundle.js',
    path: __dirname
  },
  module: {
    loaders: [
      {
        test: /.jsx?$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        query: {
          presets: ['es2015', 'react'],
          plugins: ['transform-decorators-legacy']
        }
      }
    ]
  },
  node: {
   fs: "empty"
  }
};