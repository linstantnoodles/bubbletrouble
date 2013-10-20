function PlayerSprite() {
  this.frames = {
    walkRight: [
    {x: 10},
    {x: 47},
    {x: 79},
    {x: 111},
    {x: 148},
    ],
    walkLeft: [
    {x: 353},
    {x: 321},
    {x: 289},
    {x: 252},
    {x: 212},
    ],
    fireSpear: {x: 43},
    restLeft: {x: 357},
    restRight: {x: 10},
    ready: {x: 10},
    dead: {x: 70},
  };
  this.walkIndex = 0;
  this.spriteStart = null;
  this.frameInterval = 150;
  this.deadPeriod = 3; // 3 seconds
  this.deadStatus = {
    startDead: null,
    location: {x: 0, y: 0},
    move: {dx: 1, dy: 4}
  };
}

// move the frame
PlayerSprite.prototype.updateFrame = function() {
  var timeNow = (new Date()).getTime();
  // Move to next frame when time exceeded
  if (timeNow - this.spriteStart >= this.frameInterval) {
    this.walkIndex = (this.walkIndex + 1) % 5;
    // Reset sprite timer
    this.spriteStart = (new Date()).getTime();
  }
}
// start from beginning
PlayerSprite.prototype.startMovement = function() {
  if (!this.spriteStart) {
    this.spriteStart = (new Date()).getTime();
  }
}
// reset
PlayerSprite.prototype.endMovement = function() {
  this.spriteStart = null;
  this.walkIndex = 0;
}
// initiate death process
PlayerSprite.prototype.startDead = function(x, y) {
  console.log("Starting dead process");
  if (!this.deadStatus.startDead) {
    this.deadStatus.startDead = (new Date()).getTime();
    // set current location
    this.deadStatus.location.x = x;
    this.deadStatus.location.y = y;
  }
}

PlayerSprite.prototype.getWalkLeftX = function() {
  return this.frames.walkLeft[this.walkIndex].x;
}

PlayerSprite.prototype.getWalkRightX = function() {
  return this.frames.walkRight[this.walkIndex].x;
}

PlayerSprite.prototype.getFireSpearX = function() {
  return this.frames.fireSpear.x;
}

PlayerSprite.prototype.getReadyX = function() {
  return this.frames.ready.x;
}

PlayerSprite.prototype.getRestLeftX = function() {
  return this.frames.restLeft.x;
}

PlayerSprite.prototype.getRestRightX = function() {
  return this.frames.restRight.x;
}

PlayerSprite.prototype.getDeadX = function() {
  return this.frames.dead.x;
}

PlayerSprite.prototype.getDeadLocation = function() {
  // get time change to calculate location of x and y
  var currentTime = (new Date()).getTime();
  var delta = (currentTime - this.deadStatus.startDead) / 1000;
  // if still dieing, return pos
  if (delta < this.deadPeriod) {
    this.deadStatus.location.y -= (delta * this.deadStatus.move.dy);
    this.deadStatus.location.x -= (delta * this.deadStatus.move.dx);
    this.deadStatus.move.dy -= 0.08;
    return {x: this.deadStatus.location.x, y: this.deadStatus.location.y};
  }

  return {y: 10}; // in heaven
}


