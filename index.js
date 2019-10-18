// express application adding the parse-server module to expose Parse compatible API routes.

var express = require('express');
var ParseServer = require('parse-server').ParseServer;
var path = require('path');

var databaseUri = process.env.DATABASE_URI || process.env.MONGODB_URI;

if (!databaseUri) {
  console.log('DATABASE_URI not specified, falling back to localhost.');
}

var iosKeyId = process.env.IOS_KEY_ID || 'setMe';
var iosTeamId = process.env.IOS_TEAM_ID || 'setMe';
var iosKeyPath = path.join(__dirname, 'ios_pfx', iosKeyId + '.p8');

var api = new ParseServer({
  databaseURI: databaseUri || 'mongodb://localhost:27017/dev',
  cloud: process.env.CLOUD_CODE_MAIN || __dirname + '/cloud/main.js',
  appId: process.env.APP_ID || 'myAppId',
  masterKey: process.env.MASTER_KEY || '', // Add your master key here. Keep it secret!
  fileKey: process.env.FILE_KEY || '', // Add the file key to provide access to files already hosted on Parse
  serverURL: process.env.SERVER_URL || 'http://localhost:1337/parse',  // Don't forget to change to https if needed
  push: {
    android: {
      senderId: process.env.GCM_SENDER_ID || 'setMe',
      apiKey: process.env.GCM_API_KEY || 'setMe'
    },
    ios: [
      {
        token: {
          key: iosKeyPath,
          keyId: iosKeyId,
          teamId: iosTeamId
        },
        topic: process.env.IOS_BUNDLE_ID,
        production: true
      },
      {
        token: {
          key: iosKeyPath,
          keyId: iosKeyId,
          teamId: iosTeamId
        },
        topic: process.env.IOS_BUNDLE_ID,
        production: false
      }
    ]
  },
  liveQuery: {
    classNames: ["Posts", "Comments"] // List of classes to support for query subscriptions
  }
});
// Client-keys like the javascript key or the .NET key are not necessary with parse-server
// If you wish you require them, you can set them as options in the initialization above:
// javascriptKey, restAPIKey, dotNetKey, clientKey

var app = express();

// Serve the Parse API on the /parse URL prefix
var mountPath = process.env.PARSE_MOUNT || '/parse';
app.use(mountPath, api);

// Parse Server plays nicely with the rest of your web routes
app.get('/', function(req, res) {
  res.status(200).send('Up and running.');
});

var port = process.env.PORT || 1337;
var httpServer = require('http').createServer(app);
httpServer.listen(port, function() {
    console.log('parse-server running on port ' + port + '.');
});

// This will enable the Live Query real-time server
ParseServer.createLiveQueryServer(httpServer);
