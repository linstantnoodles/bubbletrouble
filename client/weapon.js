/**
 * Weapon that breaks balls
 */
function Spear(ctx, myDot, startTime, cfg) {
  this.ctx = ctx;
  this.ownerId = cfg.ownerId || 1;
  this.startTime = cfg.startTime;
  this.currentTime = (new Date()).getTime();
  this.accum = 0;
  this.period = cfg.period || 100;
  this.dy = cfg.dy || 1;
  this.amplitude = cfg.amplitude || 10;
  this.animateSpear = cfg.animateSpear || false;
  this.lineStartTime = cfg.lineStartTime || null;
  this.lineLifeTime = cfg.lineLifeTime || 1500; // ms
  this.myDot = cfg.myDot || myDot;
  this.tipIndex = cfg.tipIndex || 0;
  this.isSolid = cfg.isSolid || false;
  this.history = cfg.history || {
    x : [],
      y : []
  };
}

Spear.prototype.draw = function() {
  if (this.isSolid) {
    this.ctx.beginPath();
    this.ctx.moveTo(this.history.x[0], this.history.y[0]);
    this.ctx.lineTo(this.history.x[0], 0);
    this.ctx.strokeStyle = "white";
    this.ctx.stroke();
  } else {
    // Draw the tip as a triangle
    var tipIndex = this.history.x.length - 1;
    this.ctx.beginPath();
    this.ctx.moveTo(this.history.x[tipIndex] - 3, this.history.y[tipIndex] - 2);
    this.ctx.lineTo(this.history.x[tipIndex], this.history.y[tipIndex] - 10);
    this.ctx.lineTo(this.history.x[tipIndex] + 3, this.history.y[tipIndex] - 2);
    this.ctx.lineJoin = 'miter';
    this.ctx.lineWidth = 2;
    this.ctx.strokeStyle = 'red';
    this.ctx.stroke();
    this.ctx.fillStyle = "red";
    for (var i = 0; i < this.history.x.length; i++) {
      this.ctx.fillRect(this.history.x[i], this.history.y[i], 2, 2);
    }

  }
}

// If the tip is at the ceiling
Spear.prototype.atCeil = function() {
  return (this.myDot.y <= 0);
}

Spear.prototype.updateState = function(cfg) {
  this.ownerId = cfg.ownerId || 1;
  this.period = cfg.period || 100;
  this.dy = cfg.dy || 1;
  this.amplitude = cfg.amplitude || 10;
  this.animateSpear = cfg.animateSpear || false;
  this.lineStartTime = cfg.lineStartTime || null;
  this.lineLifeTime = cfg.lineLifeTime || 1500; // ms
  this.myDot = cfg.myDot || myDot;
  this.tipIndex = cfg.tipIndex || 0;
  this.isSolid = cfg.isSolid || false;
  this.history = cfg.history || {
    x : [],
      y : []
  };
}

Spear.prototype.resetLine = function() {
  this.lineStartTime = null;
  this.isSolid = false;
  // Reset tip
  this.myDot.y = canvas.getHeight();
  // Empty history
  this.history.x = [];
  this.history.y = [];
  this.animateSpear = false;
}

Spear.prototype.update = function(delta) {
  if (!this.animateSpear) return;

  if (this.atCeil()) {
    //draw solid line. Keep for N ms
    var timeNow = (new Date()).getTime();
    if (!this.lineStartTime) {
      this.lineStartTime = timeNow;
      this.isSolid = true;
      this.lineMode = true;
    }

    if(timeNow - this.lineStartTime > this.lineLifeTime) {
      this.resetLine();
    }

    return;
  }
  // If first call, use persons location
  if (this.history.x.length == 0) {
    this.myDot.x = game.getPlayers()[this.ownerId].x + 10; // we should add it by 1/2 width of person
    this.myDot.y = game.getPlayers()[this.ownerId].y + 20; // Start from feet
  }

  this.history.x.push(this.myDot.x);
  this.history.y.push(this.myDot.y);
  // Update tip location
  this.tipIndex = this.history.x.length - 1;
  var time = (new Date()).getTime() - this.startTime;
  var amplitude = this.amplitude;
  // In ms
  var period = this.period;
  var centerX = this.history.x[0];
  var nextX = amplitude * Math.sin(time * 2 * Math.PI / period) + centerX;
  // Set new location of dot
  this.myDot.x = nextX;
  this.myDot.y -= this.dy * delta;
  // Draw series of dots
}


