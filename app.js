var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , fs = require('fs')
  , gameConfig = require('./config').gameConfig
  , ballConfig = require('./config').ballConfig
  , Ball = require('./ball').Ball
  , BallManager = require('./ball').BallManager;
  
app.listen(5000);

var ballManager = new BallManager();
var balls = ballManager.getBalls();
var players = {};
var spears = {};

// Collision detection
function checkForCollision(balls, spears) {
  // bounce off ground
  for(var i in balls) {
    var ball = balls[i];
    if(ball.y + ball.radius > gameConfig.boardHeight) {
      ball.ydirection = -ball.ydirection;
      ball.dy += ball.gravity;
      ball.gravity = -ball.gravity;
    }

    // bounce off walls
    if(ball.x + ball.radius > gameConfig.boardWidth || ball.x + ball.radius < 0) {
      ball.xdirection = -ball.xdirection;
    }

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

function Player(x, y, color) {
  this.color = color;
  this.x = x;
  this.dx = 10;
  this.direction = null;
  this.dy = 4;
  this.y = y;
}

Player.prototype.moveLeft = function() {
  this.x = (this.x <= 0) ? this.x : this.x - this.dx;
}

Player.prototype.moveRight = function() {
  this.x = ((this.x + 10) >= gameConfig.boardWidth) ? this.x : this.x + this.dx;
}

function Spear(myDot,ownerId, startTime) {
  this.ownerId = ownerId;
  this.startTime = startTime;
  this.animateSpear = false;
  this.lineStartTime = null;
  this.lineLifeTime = 1500; // ms
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
  console.log("Resetting spear")
  this.lineStartTime = null;
  this.isSolid = false;
  // reset tip
  this.myDot.y = gameConfig.boardHeight;
  // empty history
  this.history.x = [];
  this.history.y = [];
  this.animateSpear = false;
}

Spear.prototype.animate = function() {
  // Do not animate if false
  if(!this.animateSpear) return;
  console.log("Animating spear at " + this.getXLocation() + "," + this.getYLocation());
  // if we reach the top
  if(this.atCeil()) {
    //draw solid line. Keep for N ms
    console.log("At ceiling!");
    var timeNow = (new Date()).getTime();
    this.drawLine(timeNow);
    return;
  }

  //If first call, use persons location
  // remember to change to person location
  if(this.history.x.length == 0) {
    this.myDot.x = players[this.ownerId].x + 5; // we should add it by 1/2 width of person
    this.myDot.y = players[this.ownerId].x + 10; // Start from feet
  }
  this.history.x.push(this.myDot.x);
  this.history.y.push(this.myDot.y);

  // Update tip location
  this.tipIndex = this.history.x.length - 1;
  var time = (new Date()).getTime() - this.startTime;
  var amplitude = 3;
  // In ms
  var period = 100;
  var centerX = this.history.x[0];
  var nextX = amplitude * Math.sin(time * 2 * Math.PI / period) + centerX;
  // Set new location of dot
  this.myDot.x = nextX;
  this.myDot.y -= 2;
}


// Main game loop
function update() {
  checkForCollision(balls, spears);
  for (var i = 0; i < balls.length; i++) {
    balls[i].move();
  }
  for (var i in spears) {
    spears[i].animate();
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
    var colors = ['yellow', 'cyan', 'magenta', 'red', 'green', 'blue', 'rainbow', 'zebra'];
    var randomColor = colors[Math.floor(Math.random() * colors.length)];
    players[socket.id] = new Player(0, gameConfig.boardHeight - 10, randomColor);
    var time = (new Date()).getTime();
    var myDot = {
        x : gameConfig.boardWidth / 2,
        y : gameConfig.boardHeight,
    };
    // this shit needs to be refactored
    spears[socket.id] = new Spear(myDot, socket.id, time);
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
    if(!spears[socket.id].animateSpear) {
        spears[socket.id].animateSpear = true;
        io.sockets.emit('updateSpear', {spears: spears});
    }
  });
  // Update gameboard every second
  setInterval(function() { socket.emit('updateGame', {balls: balls, players: players}); }, 10);
});

