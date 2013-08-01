var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , fs = require('fs')
  , gameConfig = require('./config').gameConfig
  , ballConfig = require('./config').ballConfig
  , Ball = require('./ball').Ball
  , Player = require('./player').Player
  , BallManager = require('./ball').BallManager
  , PlayerManager = require('./player').PlayerManager
  , Spear = require('./weapon').Spear
  , WeaponManager = require('./weapon').WeaponManager;

app.listen(5000);

// Instantiate managers
var ballManager = new BallManager();
var playerManager = new PlayerManager();
var weaponManager = new WeaponManager();

// Get objects
var balls = ballManager.getBalls();
var players = playerManager.getPlayers();
var spears = weaponManager.getSpears();

// Collision detection
function checkForCollision(balls, spears) {
  // bounce off ground
  for (var i in balls) {
    var ball = balls[i];
      // touched by spear
    for(var i in spears) {
      var spearxloc = spears[i].getXLocation();
      var spearyloc = spears[i].getYLocation();

      if ((spearxloc >= (ball.x - ball.radius)) && (spearxloc <= (ball.x + ball.radius)) 
          && (spearyloc >= (ball.y - ball.radius)) && (spearyloc <= (ball.y + ball.radius))
          && ball.splitStatus == false) {
              ballManager.splitBall(ball);
      }
      // gotta fix the timing and location of the splitted balls
      if (spears[i].isSolid && ((spearxloc >= (ball.x - ball.radius))
          && (spearxloc <= (ball.x + ball.radius))) 
          && ball.splitStatus == false) {
          ballManager.splitBall(ball);
      }
    }

  }
}

// Main game loop
function update() {
  checkForCollision(balls, spears);
  for (var i = 0; i < balls.length; i++) {
    balls[i].move();
  }
  for (var i in spears) {
    spears[i].animate(players[i].x, players[i].y);
  }
}

function init() {
  ballManager.addBall(ballConfig);
    // kick off our game loop
  return setInterval(update, 10);
}

function handler (req, res) {
  fs.readFile(__dirname + '/index.html',
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading index.html');
    }
    res.writeHead(200);
    res.end(data);
  });
}

// initialize the game
init();
// call the timer
io.sockets.on('connection', function (socket) {
  // start listening to events
  socket.emit('news', { hello: 'world' });
  // Create char when they join
  socket.on('joinGame', function(data) {
    console.log(socket.id + " joined the game");
    playerManager.addPlayer(socket.id);
    var myDot = {
        x : gameConfig.boardWidth / 2,
        y : gameConfig.boardHeight,
    };
    // this shit needs to be refactored
    weaponManager.addSpear(socket.id, {myDot: myDot});
  });

  socket.on('getBallPos', function(data) {
    socket.emit('outputBallPos', {balls: balls, players: players});
  });
  // Player listeners
  socket.on('personMoveLeft', function(data) {
    console.log(socket.id + " moving left");
    players[socket.id].moveLeft();
    socket.broadcast.emit('updatePlayerPos', {players: players});
  });
  socket.on('personMoveRight', function(data) {
    console.log(socket.id + " moving right");
    players[socket.id].moveRight();
    socket.broadcast.emit('updatePlayerPos', {players: players});
  });
  // Spear handlers
  socket.on('fireSpear', function(data) {
    spears[socket.id].initiate();
    io.sockets.emit('updateSpear', {spears: spears});
  });
  // Update gameboard every second
  setInterval(function() { socket.emit('updateGame', {balls: balls, players: players}); }, 10);
});

