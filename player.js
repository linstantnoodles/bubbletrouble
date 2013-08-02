var gameConfig = require('./config').gameConfig;

function PlayerManager() {
  this.players = {};
}

PlayerManager.prototype.addPlayer = function(id, cfg) {
  cfg = cfg || {};
  var x = cfg.x || 0;
  var y = cfg.y || gameConfig.boardHeight - 10;

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

function Player(x, y, color) {
  this.weapon = null;
  this.color = color;
  this.x = x;
  this.dx = 10;
  this.direction = null;
  this.dy = 4;
  this.y = y;
}

Player.prototype.equipWeapon = function(weapon) {
  this.weapon = weapon;
}

Player.prototype.moveLeft = function() {
  this.x = (this.x <= 0) ? this.x : this.x - this.dx;
}

Player.prototype.moveRight = function() {
  this.x = ((this.x + 10) >= gameConfig.boardWidth) ? this.x : this.x + this.dx;
}

exports.Player = Player;
exports.PlayerManager = PlayerManager;
