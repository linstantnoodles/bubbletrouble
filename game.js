var gameConfig = require('./config').gameConfig
  , ballConfig = require('./config').ballConfig
  , playerConfig = require('./config').playerConfig
  , Ball = require('./ball').Ball
  , Player = require('./player').Player
  , BallManager = require('./ball').BallManager
  , PlayerManager = require('./player').PlayerManager
  , Spear = require('./weapon').Spear
  , WeaponManager = require('./weapon').WeaponManager
  , crypto = require('crypto');

// Fetches unique game id
var uniqueID = (function() {
  var id = 0;
  return function() { return id++; };
})();

function Game() {
  this.gameName;
  this.ballManager;
  this.playerManager;
  this.weaponManager;
  this.currentTime = (new Date()).getTime();
  this.dt = 1/60; // frames per second.
  this.accumulator = 0;
  this.balls;
  this.players;
  this.spears;
  this.globalSocket = null;
}

Game.prototype.getGameName = function() {
  return this.gameName;
}

Game.prototype.joinGame = function(id) {
  console.log("Player " + id + " joined the game!");
  this.playerManager.addPlayer(id);
  var myDot = {
      x : gameConfig.boardWidth / 2,
      y : gameConfig.boardHeight,
  };
  // this shit needs to be refactored
  this.weaponManager.addSpear(id, {myDot: myDot});
}

Game.prototype.updateAll = function(socket, msg, data) {
  socket.emit(msg, data);
  socket.broadcast.emit(msg, data);
}

Game.prototype.createSocket = function(io, mainSocket) {
  var _this = this;

  var shash = crypto.createHash('sha1');
  shash.update(uniqueID() + '');
  var gameNameHash = shash.digest('hex');
  _this.gameName = gameNameHash;
  var gameSocket = io.of('/' + gameNameHash);
  gameSocket.on('connection', function (socket) {
    _this.globalSocket = socket;
    // Send game acknowledgement
    socket.emit('gameAck');

    // Game kickoff
    socket.on('startGame', function(data) {
      if (!_this.playerManager.hasMaxPlayers()) {
        _this.joinGame(socket.id);
        _this.updateAll(socket, 'firstUpdate', {balls: _this.balls, players: _this.players, spears: _this.spears});
      } else {
        socket.emit('gameFull');
      }
    });

    // Add ball
    socket.on('addBall', function(data) {
      ballConfig.startX = gameConfig.boardWidth / 2;
      ballConfig.radius = 32;
      _this.ballManager.addBall(ballConfig);
      _this.updateAll(socket, 'updateBalls', {balls: _this.balls});
    });

    // Player listeners
    socket.on('playerMoveLeft', function(data) {
      _this.players[socket.id].moveLeft();
      // Update primary client as well to keep pos in sync
      // Todo: optimize so we're not pushing so often
      _this.updateAll(socket, 'updatePlayers', {players:_this.players});
    });

    socket.on('playerMoveRight', function(data) {
      _this.players[socket.id].moveRight();
      _this.updateAll(socket, 'updatePlayers', {players:_this.players});
    });

    socket.on('playerStopMoving', function(data) {
      _this.players[socket.id].stopMoving();
      _this.updateAll(socket, 'updatePlayers', {players:_this.players});
    });

    socket.on('fireSpear', function(data) {
      if (_this.spears[socket.id].canAnimate()) {
        _this.players[socket.id].fireSpear();
        _this.spears[socket.id].initiate();
        _this.updateAll(socket, 'updateSpear', {spears: _this.spears});
        socket.broadcast.emit('updatePlayers', {players: _this.players});
      }
    });

  });

  // Send game information
  mainSocket.emit('gameInfo', {name: gameNameHash});
}

Game.prototype.init = function() {
  this.ballManager.addBall(ballConfig);
  ballConfig.startX = 700;
  this.ballManager.addBall(ballConfig);
  ballConfig.startX = 100;
  // kick off our game loop
  return setInterval(this.update(), 1000/60);
}

Game.prototype.start = function() {
  // Game setup
  this.ballManager = new BallManager();
  this.playerManager = new PlayerManager();
  this.weaponManager = new WeaponManager();
  // Get objects
  this.balls = this.ballManager.getBalls();
  this.players = this.playerManager.getPlayers();
  this.spears = this.weaponManager.getSpears();
  // Initialize
  this.init();
}

Game.prototype.hasCollided = function(x1,y1,x2,y2,r1,r2) {
  var compareDistanceSquared = (r1 + r2) * (r1 + r2);
  var a = x1 - x2;
  var b = y1 - y2;
  var cSquared = a * a + b * b;
  var touchDistance = 0.1;
  return (cSquared - compareDistanceSquared <= touchDistance);
}

Game.prototype.runCollisionSystem = function(balls, spears, players) {
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
          this.playerManager.deletePlayer(i);
          this.weaponManager.deleteSpear(i);
        }
      }
    }
    // Touched by spear
    for (var i in spears) {
      var spearxloc = spears[i].getXLocation();
      var spearyloc = spears[i].getYLocation();
      if (this.hasCollided(spearxloc, spearyloc, ball.x, ball.y, 1, ball.radius)) {
        this.spears[i].resetLine();
        this.updateAll(this.globalSocket, 'updateSpear', {spears: spears});
        this.ballManager.splitBall(ballId, this.globalSocket);
        this.updateAll(this.globalSocket, 'updateBalls', {balls: balls});
      }
      // TODO: fix the timing and location of the splitted balls
      if (((spearxloc >= (ball.x - ball.radius))
          && (spearxloc <= (ball.x + ball.radius)))
          ) {
          this.spears[i].resetLine();
          this.updateAll(this.globalSocket, 'updateSpear', {spears: spears});
          this.ballManager.splitBall(ballId, this.globalSocket);
          this.updateAll(this.globalSocket, 'updateBalls', {balls: balls});
      }
    }

  }
}

Game.prototype.updateBallPhysics = function() {
  // update physics
  var timeNow = this.timeUpdate || (new Date()).getTime();
  var delta = (timeNow - this.currentTime) / 1000; // convert to seconds
  this.currentTime = timeNow;
  this.accumulator += delta;
  while (this.accumulator >= this.dt){
    this.accumulator -= this.dt;
    for (var i in this.balls) {
      this.balls[i].move(this.dt);
    }
    for (var i in this.spears) {
      this.spears[i].update(this.dt, this.players[i].x, this.players[i].y);
    }
    for (var i in this.players) {
      this.players[i].updatePosition(this.dt);
    }
  }

}

Game.prototype.update = function() {
  var _this = this;
  return function() {
    _this.runCollisionSystem(_this.balls, _this.spears, _this.players);
    _this.updateBallPhysics();
  }
}

exports.Game = Game;
