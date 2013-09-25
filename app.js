var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , fs = require('fs')
  , url = require('url')
  , gameConfig = require('./config').gameConfig
  , ballConfig = require('./config').ballConfig
  , playerConfig = require('./config').playerConfig
  , Ball = require('./ball').Ball
  , Player = require('./player').Player
  , BallManager = require('./ball').BallManager
  , PlayerManager = require('./player').PlayerManager
  , Spear = require('./weapon').Spear
  , WeaponManager = require('./weapon').WeaponManager
  , crypto = require('crypto');

app.listen(5000);

var uniqueID = (function() {
  var id = 0;
  return function() { return id++; };
})();

// Instantiate managers
var ballManager = new BallManager();
var playerManager = new PlayerManager();
var weaponManager = new WeaponManager();
var globalSocket = null;

// Get objects
var balls = ballManager.getBalls();
var players = playerManager.getPlayers();
var spears = weaponManager.getSpears();


function hasCollided(x1,y1,x2,y2,r1,r2) {
  var compareDistanceSquared = (r1 + r2) * (r1 + r2);
  var a = x1 - x2;
  var b = y1 - y2;
  var cSquared = a * a + b * b;
  var touchDistance = 0.1;
  return (cSquared - compareDistanceSquared <= touchDistance);
}
// Collision detection
function checkForCollision(balls, spears, players) {
  // bounce off ground
  for (var i in balls) {
    var ball = balls[i];
    var ballId = i;
    // Touches player
    for (var i in players) {
      // Check if player intersects with ball
      var player = players[i];
      var compareDistance = (playerConfig.playerHeight / 2) + ballConfig.radius;
      var compareDistanceSquared = compareDistance * compareDistance;
      var a = player.getX() - ball.x;
      var b = player.getY() - ball.y;
      var cSquared = a * a + b * b;
      var touchDistance = 0.01;
      if (cSquared - compareDistanceSquared <= touchDistance) {
        player.decreaseLife();
        // If player killed, remove from game
        if (!player.isAlive()) {
          // Remove both player and weapon
          // Note:: this should just be done by one call
          // to player manager..
          playerManager.deletePlayer(i);
          weaponManager.deleteSpear(i);
        }
      }
    }
    // Touched by spear
    for (var i in spears) {
      var spearxloc = spears[i].getXLocation();
      var spearyloc = spears[i].getYLocation();
      if (hasCollided(spearxloc, spearyloc, ball.x, ball.y, 1, ball.radius)) {
        spears[i].resetLine();
        globalSocket.emit('updateSpear', {spears: spears});
        ballManager.splitBall(ballId, globalSocket);
        globalSocket.emit('updateBalls', {balls: balls});
      }
      // TODO: fix the timing and location of the splitted balls
      if (((spearxloc >= (ball.x - ball.radius))
          && (spearxloc <= (ball.x + ball.radius)))
          ) {
          spears[i].resetLine();
          globalSocket.emit('updateSpear', {spears: spears});
          ballManager.splitBall(ballId, globalSocket);
          globalSocket.emit('updateBalls', {balls: balls});
      }
    }

  }

}
var currentTime = (new Date()).getTime();
var dt = 1/60; // frames per second.
var accumulator = 0;

function updateBallPhysics(timeUpdate) {
  // update physics
  var timeNow = timeUpdate || (new Date()).getTime();
  var delta = (timeNow - currentTime) / 1000; //convert to seconds
  currentTime = timeNow;
  accumulator += delta;
  while (accumulator >= dt){
    accumulator -= dt;
    for (var i in balls) {
      balls[i].move(dt);
    }
    for (var i in spears) {
      spears[i].update(dt, players[i].x, players[i].y);
    }
    for (var i in players) {
      players[i].updatePosition(dt);
    }

  }
}

// Main game loop
function update() {
  checkForCollision(balls, spears, players);
  updateBallPhysics();
}

function init() {
  ballManager.addBall(ballConfig);
  ballConfig.startX = 700;
  ballManager.addBall(ballConfig);
  ballConfig.startX = 100;
    // kick off our game loop
  return setInterval(update, 1000/60);
}

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
// initialize the game
init();
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
          socket.emit('gameAck', {
          that: 'only'
        , '/test': 'will get'
      });
      // Initiate all other handlers
    });
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

