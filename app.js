var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , fs = require('fs')
  , url = require('url')
  , Game = require('./game').Game
  , crypto = require('crypto');

app.listen(5000);

var bubbletrouble = new Game();
bubbletrouble.start();

var uniqueID = (function() {
  var id = 0;
  return function() { return id++; };
})();

var assetDirectory = '.'; // current director
var headerMap = {
    'jpg': 'image/jpg',
    'png': 'image/png',
    'wav': 'audio/x-wav',
    'mp3': 'audio/mpeg',
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
    var data = fs.readFileSync('./index.html');
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end(data);
  }
}
// call the timer
io.sockets.on('connection', function (socket) {
  globalSocket = io.sockets;
  // start listening to events
  socket.emit('acknowledge');
  socket.on('newGame', function(data) {
    // Same process, just with a namespaced game room
    var shash = crypto.createHash('sha1');
    var gameid = uniqueID();
    shash.update(gameid + '');
    var gameNameHash = shash.digest('hex');
    var chat = io.of('/'+gameNameHash);
    chat.on('connection', function (socket) {
        // Send game acknowledgement
        socket.emit('gameAck', {
          that: 'only'
        , '/test': 'will get'
      });
        socket.on('startGame', function(data) {
          console.log("Start the game yo");
      });
      // Initiate all other handlers
    });
    // Send game information
    socket.emit('gameInfo', {name: gameNameHash});
  });
  // Create char when they join
  socket.on('joinGame', function(data) {
    if(!playerManager.hasMaxPlayers()) {
      console.log(socket.id + " joined the game");
      playerManager.addPlayer(socket.id);
      var myDot = {
          x : gameConfig.boardWidth / 2,
          y : gameConfig.boardHeight,
      };
      // this shit needs to be refactored
      weaponManager.addSpear(socket.id, {myDot: myDot});
      io.sockets.emit('firstUpdate', {balls: balls, players: players, spears: spears});
    } else {
      socket.emit('gameFull');
    }
  });

  socket.on('addBall', function(data) {
    ballConfig.startX = gameConfig.boardWidth / 2;
    ballConfig.radius = 32;
    ballManager.addBall(ballConfig);
    io.sockets.emit('updateBalls', {balls: balls});
  });

  // Player listeners
  socket.on('playerMoveLeft', function(data) {
    players[socket.id].moveLeft();
    // Update primary client as well to keep pos in sync
    // Todo: optimize so we're not pushing so often
    io.sockets.emit('updatePlayers', {players: players});
  });

  socket.on('playerMoveRight', function(data) {
    players[socket.id].moveRight();
    io.sockets.emit('updatePlayers', {players: players});
  });

  socket.on('playerStopMoving', function(data) {
    players[socket.id].stopMoving();
    io.sockets.emit('updatePlayers', {players: players});
  });

  // Spear handlers
  socket.on('fireSpear', function(data) {
    if (spears[socket.id].canAnimate()) {
      players[socket.id].fireSpear();
      spears[socket.id].initiate();
      io.sockets.emit('updateSpear', {spears: spears});
      socket.broadcast.emit('updatePlayerPos', {players: players});
    }
  });

});

