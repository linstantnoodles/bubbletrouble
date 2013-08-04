var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , fs = require('fs')
  , gameConfig = require('./config').gameConfig
  , ballConfig = require('./config').ballConfig
  , playerConfig = require('./config').playerConfig
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

function hasCollided(x1,y1,x2,y2,r1,r2) {
  var compareDistanceSquared = (r1 + r2) * (r1 + r2);
  var a = x1 - x2;
  var b = y1 - y2;
  var cSquared = a * a + b * b;
  var touchDistance = 0.1;
  return (cSquared - compareDistanceSquared <= touchDistance);
}
// Collision detection
function checkForCollision(balls, spears, players) {
  // bounce off ground
  for (var i in balls) {
    var ball = balls[i];
    // Touches player
    for(var i in players) {
      // Check if player intersects with ball
      var player = players[i];
      var compareDistance = (playerConfig.playerHeight / 2) + ballConfig.radius;
      var compareDistanceSquared = compareDistance * compareDistance;
      var a = player.getX() - ball.x;
      var b = player.getY() - ball.y;
      var cSquared = a * a + b * b;
      var touchDistance = 0.01;
      if (cSquared - compareDistanceSquared <= touchDistance) {
        player.decreaseLife();
        // If player killed, remove from game
        if (!player.isAlive()) {
          // Remove both player and weapon
          // Note:: this should just be done by one call
          // to player manager..
          playerManager.deletePlayer(i);
          weaponManager.deleteSpear(i);
        }
      }
    }
    // Touched by spear
    for(var i in spears) {
      var spearxloc = spears[i].getXLocation();
      var spearyloc = spears[i].getYLocation();
      if (hasCollided(spearxloc, spearyloc, ball.x, ball.y, 1, ball.radius)) {
        ballManager.splitBall(ball);
      }
      /*if ((spearxloc >= (ball.x - ball.radius)) && (spearxloc <= (ball.x + ball.radius))
          && (spearyloc >= (ball.y - ball.radius)) && (spearyloc <= (ball.y + ball.radius))
          ) {
              ballManager.splitBall(ball);
      }*/
      // gotta fix the timing and location of the splitted balls
      if (spears[i].isSolid && ((spearxloc >= (ball.x - ball.radius))
          && (spearxloc <= (ball.x + ball.radius)))
          ) {
          ballManager.splitBall(ball);
      }
    }

  }

}

// Main game loop
function update() {
  checkForCollision(balls, spears, players);
  for (var i = 0; i < balls.length; i++) {
    balls[i].move();
  }
  for (var i in spears) {
    spears[i].animate(players[i].x, players[i].y);
  }
}

function init() {
  ballManager.addBall(ballConfig);
  ballConfig.startX = 30;
  ballManager.addBall(ballConfig);
  ballConfig.startX = 100;
  ballManager.addBall(ballConfig);
  ballConfig.startX = 150;
  ballManager.addBall(ballConfig);
    // kick off our game loop
  return setInterval(update, 15);
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
  socket.emit('acknowledge');
  // Create char when they join
  socket.on('joinGame', function(data) {
    if(!playerManager.hasMaxPlayers()) {
      console.log(socket.id + " joined the game");
      playerManager.addPlayer(socket.id);
      var myDot = {
          x : gameConfig.boardWidth / 2,
          y : gameConfig.boardHeight,
      };
      // this shit needs to be refactored
      weaponManager.addSpear(socket.id, {myDot: myDot});
    } else {
      socket.emit('gameFull');
    }
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
    if (spears[socket.id].canAnimate()) {
      spears[socket.id].initiate();
      io.sockets.emit('updateSpear', {spears: spears});
    }
  });
  // Update gameboard every second
  setInterval(function() { socket.emit('updateGame', {balls: balls, players: players}); }, 1000/60);
});

