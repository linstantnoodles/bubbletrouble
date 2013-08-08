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
  this.movingRight = true;
  this.firedSpear = false;
  this.x = x;
  this.dx = 20;
  this.direction = null;
  this.dy = 4;
  this.y = y;
  this.immunity = {
    period: 2000,
    start: null
  };
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

Player.prototype.moveLeft = function() {
  this.movingRight = false;
  this.firedSpear = false;
  this.x = (this.x <= 0) ? this.x : this.x - this.dx;
}

Player.prototype.moveRight = function() {
  this.movingRight = true;
  this.firedSpear = false;
  this.x = ((this.x + playerConfig.playerWidth) >= gameConfig.boardWidth) ? this.x : this.x + this.dx;
}

exports.Player = Player;
exports.PlayerManager = PlayerManager;
