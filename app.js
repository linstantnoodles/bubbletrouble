var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , fs = require('fs')

app.listen(5000);
// create the game board
// set the size of the canvas
var boardWidth = 300;
var boardHeight = 150;
var x = boardWidth / 2;
var y = boardHeight / 2;
var radius = 16;
var balls = [];
var players = [];

function Person(x, y) {
  this.x = x;
  this.dx = 10;
  this.direction = null;
  this.dy = 4;
  this.y = y;
}

Person.prototype.moveLeft = function() {
  this.x = (this.x <= 0) ? this.x : this.x - this.dx;
}

Person.prototype.moveRight = function() {
  this.x = ((this.x + 10) >= boardWidth) ? this.x : this.x + this.dx;
}

/*Person.prototype.move = function() {
  if(this.direction == 'right')
    this.moveRight();
  else if(this.direction == 'left')
    this.moveLeft();
}*/

function Ball(x, y, radius, initDirection) {
  this.x = x;
  this.y = y;
  this.dx = (initDirection == 'right') ? 1 : -1;
  this.dy = 0;
  this.gravity = 0.1;
  this.xdirection = 0.8;
  this.splitStatus = false;
  this.ydirection = 1;
  this.radius = radius;
}

Ball.prototype.move = function() {
  this.hasCollided();
  this.dy += this.gravity;
  this.x += this.dx * this.xdirection;
  this.y += this.dy * this.ydirection;
}

Ball.prototype.splitBall = function() {
  // explode the ball
  this.splitStatus = true; // update the split status so it doesnt create multiple balls
  // should start high but bounce low (min = height of user)
  // delete current ball
  balls.splice(balls.indexOf(this), 1);
  // split into two balls if big enough
  if (this.radius > 4) {
    var ballone = new Ball(this.x - 20, this.y - 5, (this.radius / 2), 'left');
    var balltwo = new Ball(this.x + 20, this.y - 5, (this.radius / 2), 'right');
    balls.push(ballone);
    balls.push(balltwo);
  }
}

Ball.prototype.hasCollided = function() {
  // bounce off ground
  if(this.y + this.radius > boardHeight) {
    this.ydirection = -this.ydirection;
    this.dy += this.gravity;
    this.gravity = -this.gravity;
  }

  // bounce off walls
  if(this.x + this.radius > boardWidth || this.x + this.radius < 0) {
    this.xdirection = -this.xdirection;
  }

  // touched by spear
  /*
  var spearxloc = person.weapon.getxlocation();
  var spearyloc = person.weapon.getylocation();

  if ((spearxloc >= (this.x - this.radius)) && (spearxloc <= (this.x + this.radius)) 
      && (spearyloc >= (this.y - this.radius)) && (spearyloc <= (this.y + this.radius))
      && this.splitStatus == false) {
        this.splitBall();
  }

  // gotta fix the timing and location of the splitted balls
  if (person.weapon.issolid && ((spearxloc >= (this.x - this.radius))
    && (spearxloc <= (this.x + this.radius))) 
    && this.splitStatus == false) {
      this.splitBall();
  }
  */
}

// Main game loop
function update() {
  for (var i = 0; i < balls.length; i++) {
    balls[i].move();
  }
}

function addBall() {
  balls.push(new Ball(x, y, radius, 'right'));
}

function init() {
  balls.push(new Ball(x, y, radius, 'right'));
  players.push(new Person(0, boardHeight - 10));
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
  // first push
  socket.on('getBallPos', function(data) {
    socket.emit('outputBallPos', {balls: balls, players: players});
  });
  // On add ball msg
  socket.on('addBall', function(data) {
    socket.broadcast.emit('fucker', { hello: 'world' });
    addBall();
  });

  // Person listeners
  socket.on('personMoveLeft', function(data) {
    players[0].moveLeft();
    console.log("Emitting move left");
    socket.broadcast.emit('updatePlayerPos', {players: players});
  });

  socket.on('personMoveRight', function(data) {
    players[0].moveRight();
    console.log("Emitting move right");
    socket.broadcast.emit('updatePlayerPos', {players: players});
  });

  // Update gameboard every second
  setInterval(function() { socket.emit('updateGame', {balls: balls, players: players}); }, 100);
});

