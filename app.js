var express = require('express')
  , app = express()
  , http = require('http')
  , server = http.createServer(app)
  , io = require('socket.io').listen(server)
  , fs = require('fs')
  , url = require('url')
  , Game = require('./server/game').Game;

app.use(express.static(__dirname + '/client'));
// reduce logging
io.set('log level', 1);
// Game map
var games = {};
// Main socket
io.sockets.on('connection', function (socket) {
  // Start listening to events
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

var port = Number(process.env.PORT || 5000);
server.listen(port);

