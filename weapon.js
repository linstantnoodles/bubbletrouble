var gameConfig = require('./config').gameConfig;
var playerConfig = require('./config').playerConfig;

function WeaponManager() {
  this.spears = {};
}

WeaponManager.prototype.getSpears = function() {
  return this.spears;
}

WeaponManager.prototype.addSpear = function(ownerId, cfg) {
  var myDot = cfg.myDot || {x:0,y:0};
  var startTime = (new Date()).getTime();
  this.spears[ownerId] = new Spear(myDot, ownerId, startTime);
}

function Spear(myDot, ownerId, startTime) {
  this.ownerId = ownerId;
  this.startTime = startTime;
  this.animateSpear = false;
  this.lineStartTime = null;
  this.lineLifeTime = 1500; // ms
  this.amplitude = 5;
  this.period = 100;
  this.dy = 5;
  this.myDot = myDot;
  this.tipIndex = 0;
  this.isSolid = false;
  this.history = {
    x : [],
    y : []
  };
}
// if the oscillation is at ceil
Spear.prototype.atCeil = function() {
  return (this.myDot.y <= 0);
}

// get tip location for collision detection
Spear.prototype.getXLocation = function() {
  return this.history.x[this.tipIndex];
}

Spear.prototype.getYLocation = function() {
  return this.history.y[this.tipIndex];
}

Spear.prototype.drawLine = function(timenow) {
  // start the solid
  if(!this.lineStartTime) {
    this.lineStartTime = timenow;
    this.isSolid = true;
  }
  // kill solid line after 1000 ms
  if(timenow - this.lineStartTime > this.lineLifeTime) {
    this.resetLine();
  }
}

Spear.prototype.resetLine = function() {
  this.lineStartTime = null;
  this.isSolid = false;
  // reset tip
  this.myDot.y = gameConfig.boardHeight;
  // empty history
  this.history.x = [];
  this.history.y = [];
  this.animateSpear = false;
}

Spear.prototype.initiate = function() {
    if (!this.animateSpear) {
        this.animateSpear = true;
    }
}

Spear.prototype.animate = function(x, y) {
  // Do not animate if false
  if (!this.animateSpear) return;
  // if we reach the top
  if (this.atCeil()) {
    //draw solid line. Keep for N ms
    var timeNow = (new Date()).getTime();
    this.drawLine(timeNow);
    return;
  }

  //If first call, use persons location
  // remember to change to person location
  if(this.history.x.length == 0) {
    this.myDot.x = x + (playerConfig.playerWidth / 2); // we should add it by 1/2 width of person
    this.myDot.y = y + (playerConfig.playerHeight); // Start from feet
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
  this.myDot.y -= this.dy;
}

exports.Spear = Spear;
exports.WeaponManager = WeaponManager;
