/**
 * The player
 */
function Player(x, y, ctx, cfg) {
  this.color = cfg.color || 'blue';
  this.x = cfg.x || x;
  this.dx = cfg.dx || 4;
  this.direction = cfg.direction || null;
  this.currentTime = (new Date()).getTime();
  this.accum = 0;
  this.dy = cfg.dy || 4;
  this.y = cfg.y || y;
  this.ctx = ctx;
  this.spriteStart = null;
  this.knockedLeft;
  this.knockedRight;
  this.hurt;
  this.walkIndex = 0;
  this.movingRight = cfg.movingRight;
  this.moving = false;
  this.firedSpear = cfg.firedSpear;
  this.stationary = false;
  this.state = cfg.state;
  this.sprite = new PlayerSprite();
}

Player.state = {
  REST_LEFT: 1,
  REST_RIGHT: 2,
  MOVE_LEFT: 3,
  MOVE_RIGHT: 4,
  FIRE_SPEAR: 5,
  DEAD: 6
}

Player.prototype.startMoving = function() {
  this.sprite.startMovement();
}

Player.prototype.stopMoving = function() {
  if (this.state == Player.state.MOVE_RIGHT) {
    this.setState(Player.state.REST_RIGHT);
  } else if (this.state == Player.state.MOVE_LEFT) {
    this.setState(Player.state.REST_LEFT);
  }

  this.sprite.endMovement();
}

Player.prototype.die = function() {
  this.setState(Player.state.DEAD);
  this.sprite.startDead(this.x, this.y);
}

Player.prototype.setState = function(state) {
  // No player activated state change allowed when dead
  if (this.state == Player.state.DEAD) {
    return;
  }

  this.state = state;
}

Player.prototype.isAlive = function() {
  return (this.state != Player.state.DEAD);
}

Player.prototype.revive = function() {
  // Reset location
  // Change to ready state
}

Player.prototype.updatePlayer = function(playerData) {
  this.x = playerData.x;
  this.y = playerData.y;
  this.dx = playerData.dx;
  if (playerData.state == Player.state.MOVE_LEFT || playerData.state == Player.state.MOVE_RIGHT) {
    var playerId = playerData.pid;
    this.startMoving();
  }

  if (playerData.state == Player.state.REST_RIGHT || playerData.state == Player.state.REST_LEFT) {
    this.stopMoving();
  }
  this.state = playerData.state;
  this.color = playerData.color;
}

Player.prototype.updateSprite = function() {
  this.sprite.updateFrame();
}

Player.prototype.isMoving = function () {
  return this.movingRight || this.movingLeft;
}

Player.prototype.fireSpear = function() {
  this.setState(Player.state.FIRE_SPEAR);
}

Player.prototype.updatePosition = function(delta) {
  if (this.state == Player.state.MOVE_LEFT) {
    this.x = (this.x <= 0) ? this.x : this.x - this.dx;
  } else if (this.state == Player.state.MOVE_RIGHT) {
    this.x = ((this.x + 10) >= canvas.getWidth()) ? this.x : this.x + this.dx;
  }
}

Player.prototype.draw = function() {
  switch (this.state) {
    case Player.state.FIRE_SPEAR:
      this.ctx.drawImage(PlayerSprite.getRsprite(), this.sprite.getFireSpearX(), 110, 32, 32, this.x, this.y - 13, 32, 32);
      break;
    case Player.state.MOVE_LEFT:
      this.updateSprite();
      this.ctx.drawImage(PlayerSprite.getLsprite(), this.sprite.getWalkLeftX(), 0, 32, 32, this.x, this.y - 13, 32, 32);
      break;
    case Player.state.MOVE_RIGHT:
      this.updateSprite();
      this.ctx.drawImage(PlayerSprite.getRsprite(), this.sprite.getWalkRightX(), 0, 32, 32, this.x, this.y - 13, 32, 32);
      break;
    case Player.state.REST_LEFT:
      this.ctx.drawImage(PlayerSprite.getLsprite(), this.sprite.getRestLeftX(), 110, 32, 32, this.x, this.y - 13, 32, 32);
      break;
    case Player.state.REST_RIGHT:
      this.ctx.drawImage(PlayerSprite.getRsprite(), this.sprite.getRestRightX(), 110, 32, 32, this.x, this.y - 13, 32, 32);
      break;
    case Player.state.DEAD:
      this.ctx.drawImage(PlayerSprite.getRsprite(), this.sprite.getDeadX(), 110, 43, 32, (this.sprite.getDeadLocation()).x, (this.sprite.getDeadLocation()).y - 13, 32, 32);
      break;
    default:
      this.ctx.drawImage(PlayerSprite.getRsprite(), this.sprite.getReadyX(), 110, 32, 32, this.x, this.y - 13, 32, 32);
    break;
  }
}

Player.prototype.moveLeft = function() {
  this.startMoving();
  this.setState(Player.state.MOVE_LEFT);
}

Player.prototype.moveRight = function() {
  this.startMoving();
  this.setState(Player.state.MOVE_RIGHT);
}


