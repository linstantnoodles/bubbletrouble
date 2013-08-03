/*
 * Contains config data for game and objects
 */

var boardWidth = 1000;
var boardHeight = 400;
var playerHeight = 20;
var playerWidth = 20;

// Global game configuration
exports.gameConfig = {
  boardWidth: boardWidth,
  boardHeight: boardHeight,
}

// Ball configuration
exports.ballConfig = {
  startX: boardWidth / 2,
  startY: boardHeight - ((boardHeight * 3) /4),
  radius: 32,
  color: 'blue',
}

// Player configuration
exports.playerConfig = {
  playerHeight : 20,
  playerWidth : 20,
}

