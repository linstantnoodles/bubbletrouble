var gameConfig = require('./config').gameConfig;
var playerConfig = require('./config').playerConfig;

function PlayerManager() {
  this.maxPlayers = 4;
  this.players = {};
}

PlayerManager.prototype.addPlayer = function(id, cfg) {
  cfg = cfg || {};
  var x = cfg.x || 0;
  var y = cfg.y || gameConfig.boardHeight - playerConfig.playerHeight;

  var colors = ['yellow', 'cyan', 'purple', 'red', 'green', 'blue'];
  var randomColor = colors[Math.floor(Math.random() * colors.length)];
  var color = cfg.color || randomColor;
  this.players[id] = new Player(x, y, color);
}

PlayerManager.prototype.deletePlayer = function(id) {
  delete this.players[id];
}

PlayerManager.prototype.getPlayers = function() {
  return this.players;
}

PlayerManager.prototype.hasMaxPlayers = function() {
  return Object.keys(this.players).length == this.maxPlayers;
}

function Player(x, y, color) {
  this.weapon = null;
  this.color = color;
  this.life = 5000;
  this.state = Player.state.REST_RIGHT;
  this.x = x;
  this.dx = 4;
  this.direction = null;
  this.dy = 4;
  this.y = y;
  this.immunity = {
    period: 2000,
    start: null
  };
}

// Various states
Player.state = {
  REST_LEFT: 1,
  REST_RIGHT: 2,
  MOVE_LEFT: 3,
  MOVE_RIGHT: 4,
  FIRE_SPEAR: 5
}

Player.prototype.equipWeapon = function(weapon) {
  this.weapon = weapon;
}

Player.prototype.getX = function() {
  return this.x + playerConfig.playerWidth / 2;
}

Player.prototype.getY = function() {
  return this.y + playerConfig.playerHeight / 2;
}

Player.prototype.setImmune = function(ms) {
  this.immunity.period = ms || 2000;
  this.immunity.start = (new Date()).getTime();
}

Player.prototype.isImmune = function() {
  if (this.immunity.start) {
    return (new Date()).getTime() - this.immunity.start < this.immunity.period;
  }
  return false;
}

Player.prototype.decreaseLife = function() {
  if(!this.isImmune()) {
    // Decrease life
    this.life -= 20;
    // Set immunity to two secs
    this.setImmune(2000);
  }
}

Player.prototype.isAlive = function() {
  return this.life > 0;
}

Player.prototype.updatePosition = function(delta) {
  if (this.state == Player.state.MOVE_LEFT) {
    this.x = (this.x <= 0) ? this.x : this.x - this.dx;
  } else if (this.state == Player.state.MOVE_RIGHT) {
    this.x = ((this.x + playerConfig.playerWidth) >= gameConfig.boardWidth) ? this.x : this.x + this.dx;
  }
}

Player.prototype.moveLeft = function() {
  this.state = Player.state.MOVE_LEFT;
}

Player.prototype.moveRight = function() {
  this.state = Player.state.MOVE_RIGHT;
}

Player.prototype.fireSpear = function() {
   this.state = Player.state.FIRE_SPEAR;
}

Player.prototype.stopMoving = function() {
  if (this.state == Player.state.MOVE_RIGHT) {
    this.state = Player.state.REST_RIGHT;
  } else {
    this.state = Player.state.REST_LEFT;
  }
}

exports.Player = Player;
exports.PlayerManager = PlayerManager;
