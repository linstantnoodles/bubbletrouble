var gameConfig = require('./config').gameConfig
  , ballConfig = require('./config').ballConfig
  , playerConfig = require('./config').playerConfig
  , Ball = require('./ball').Ball
  , Player = require('./player').Player
  , BallManager = require('./ball').BallManager
  , PlayerManager = require('./player').PlayerManager
  , Spear = require('./weapon').Spear
  , WeaponManager = require('./weapon').WeaponManager;

function Game() {
  this.ballManager;
  this.playerManager;
  this.weaponManager;
  this.currentTime = (new Date()).getTime();
  this.dt = 1/60; // frames per second.
  this.accumulator = 0;
  this.balls;
  this.players;
  this.spears;
  this.globalSocket = null; // TODO:: Add socket communication
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
        spears[i].resetLine();
        this.globalSocket.emit('updateSpear', {spears: spears});
        this.ballManager.splitBall(ballId, globalSocket);
        globalSocket.emit('updateBalls', {balls: balls});
      }
      // TODO: fix the timing and location of the splitted balls
      if (((spearxloc >= (ball.x - ball.radius))
          && (spearxloc <= (ball.x + ball.radius)))
          ) {
          spears[i].resetLine();
          this.globalSocket.emit('updateSpear', {spears: spears});
          this.ballManager.splitBall(ballId, globalSocket);
          this.globalSocket.emit('updateBalls', {balls: balls});
      }
    }

  }
}

Game.prototype.updateBallPhysics = function() {
  // update physics
  var timeNow = this.timeUpdate || (new Date()).getTime();
  var delta = (timeNow - this.currentTime) / 1000; //convert to seconds
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
