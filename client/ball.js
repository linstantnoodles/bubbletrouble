/**
 * The ball
 */
function Ball(x, y, radius, dy, initDirection, canvas, cfg) {
  this.x = cfg.x || x;
  this.accum = 0;
  // x location
  this.y = cfg.y || y;
  this.color = cfg.color || '#E00000';
  this.currentTime = (new Date()).getTime();
  // location
  this.dx = cfg.dx;
  // x velocity
  this.dy = cfg.dy || 0;
  // y velocity
  this.gravity = cfg.gravity || 0.1;
  this.xdirection = cfg.xdirection || 0.8;
  this.splitStatus = cfg.splitStatus || false;
  // Direction y
  this.ydirection = cfg.ydirection || 1;
  this.radius = cfg.radius || radius;
  this.canvas = canvas;
  this.ctx = canvas.getContext();
}

Ball.getBallColor = function(size) {
  if(size >= 32) {
    return 'red';
  } else if (size >= 16) {
    return 'blue';
  } else if (size >= 8) {
    return 'yellow';
  } else {
    return 'green';
  }
}

Ball.prototype.draw = function() {
  this.ctx.beginPath();
  this.ctx.fillStyle = this.color;
  this.ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI, true);
  this.ctx.closePath();
  this.ctx.fill();
  this.ctx.lineWidth = 3;
  this.ctx.strokeStyle = "black";
  this.ctx.stroke();
}

Ball.prototype.move = function(delta) {
  this.hasCollided();
  this.dy += this.gravity;
  this.x += this.dx * this.xdirection * delta;
  this.y += this.dy * this.ydirection * delta;
}

Ball.prototype.hasCollided = function() {
  // Bounce off ground
  if (this.y + this.radius > this.canvas.getHeight()) {
    this.ydirection = -this.ydirection;
    this.dy += this.gravity;
    this.gravity = -this.gravity;
  }
  // Bounce off walls
  if (this.x + this.radius >= this.canvas.getWidth() || this.x - this.radius <= 0) {
    this.xdirection = -this.xdirection;
  }
}


