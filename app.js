var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , fs = require('fs')
  , url = require('url')
  , Game = require('./server/game').Game;

app.listen(5000);
// reduce logging
io.set('log level', 1);

// Game map
var games = {};

// Request handler
var assetDirectory = './client';
var headerMap = {
    'jpg': 'image/jpg',
    'png': 'image/png',
    'wav': 'audio/x-wav',
    'mp3': 'audio/mpeg',
    'css': 'text/css',
}

function handler (req, res) {
  var request = url.parse(req.url, true);
  var pathToFile = request.pathname;
  var urlParts = pathToFile.split('/');
  var content = (urlParts[urlParts.length-1]).split('.');
  // If static file
  if (content.length > 1) {
    var extension = content[content.length-1];
    var data = fs.readFileSync(assetDirectory + pathToFile);
    res.writeHead(200, {'Content-Type': headerMap[extension]});
    res.end(data);
  }
  // Send index
  if (pathToFile == '/') {
    var data = fs.readFileSync('./client/index.html');
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end(data);
  }
}

// Main socket
io.sockets.on('connection', function (socket) {
  // start listening to events
  socket.emit('acknowledge');

  socket.on('newGame', function(data) {
    var newGame = new Game();
    newGame.start();
    newGame.createSocket(io, socket);
    console.log("Game created: ");
    console.log(newGame.getGameName());
    games[newGame.getGameName()] = newGame;
  });

  socket.on('joinGame', function(data) {
    var gameName = data.gamename;
    if (games[gameName]) {
      socket.emit('gameInfo', {name: gameName, role: 'joiner'});
    } else {
      socket.emit('error', {msg: "Sorry, that game does not exist."});
    }
  });

});
