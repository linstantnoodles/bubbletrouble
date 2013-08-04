var gameConfig = require('./config').gameConfig;
var ballConfig = require('./config').ballConfig;

function BallManager() {
  this.balls = [];
}

BallManager.prototype.splitBall = function(ball) {
  if (!ball.isImmune()) {
  // explode the ball
    this.balls.splice(this.balls.indexOf(ball), 1);
    // split into two balls if big enough
    if (ball.radius > ballConfig.radius / 4) {
      // should start high but bounce low (min = height of user)
      var ballone = new Ball(ball.x - 15, ball.y - 5, (ball.radius / 2), 'left');
      var balltwo = new Ball(ball.x + 15, ball.y - 5, (ball.radius / 2), 'right');
      ballone.setImmune(1000);
      balltwo.setImmune(1000);
      this.balls.push(ballone);
      this.balls.push(balltwo);
    }
  }
}

// Get all balls
BallManager.prototype.getBalls = function() {
  return this.balls;
}

// Add a new ball
BallManager.prototype.addBall = function(cfg) {
  var startX = cfg.startX || 150;
  var startY = cfg.startY || 75;
  var radius = cfg.radius || 16;
  var color = cfg.color || 'blue';
  // Maybe also add direction?
  this.balls.push(new Ball(startX, startY, radius, 'right'));
}

function Ball(x, y, radius, initDirection) {
  this.x = x;
  this.y = y;
  this.dx = (initDirection == 'right') ? 1 : -1;
  this.dy = 0;
  this.gravity = 0.1;
  this.xdirection = 1.2;
  this.splitStatus = false;
  this.ydirection = 1;
  this.radius = radius;
  this.immunity = {
    period: 1000,
    start: null
  };
}

Ball.prototype.setImmune = function(ms) {
  this.immunity.period = ms || 1000;
  this.immunity.start = (new Date()).getTime();
}

Ball.prototype.isImmune = function() {
  if (this.immunity.start) {
    return (new Date()).getTime() - this.immunity.start < this.immunity.period;
  }
  return false;
}

Ball.prototype.move = function() {
  this.checkBoundaryCollision();
  this.dy += this.gravity;
  this.x += this.dx * this.xdirection;
  this.y += this.dy * this.ydirection;
}

Ball.prototype.checkBoundaryCollision = function() {
  // Bounce off ground
  if (this.y + this.radius > gameConfig.boardHeight) {
    this.ydirection = -this.ydirection;
    this.dy += this.gravity;
    this.gravity = -this.gravity;
  }

  // bounce off walls
  if (this.x + this.radius > gameConfig.boardWidth || this.x + this.radius < 0) {
    this.xdirection = -this.xdirection;
  }
}

// Export ball
exports.Ball = Ball;
exports.BallManager = BallManager;
