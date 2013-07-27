var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , fs = require('fs')

app.listen(5000);
// create the game board
//set the size of the canvas
var x = 75;
var y = 75;
// ball radius
var radius = 16;

// Basically a portion of the gameboard
var balls = [];

function Ball(x, y, radius, initDirection) {
  this.x = x;
  // x location
  this.y = y;
  // location
  this.dx = (initDirection == 'right') ? 1 : -1;
  // x velocity
  this.dy = 0;
  // y velocity
  this.gravity = 0.1;
  this.xdirection = 0.8;
  this.splitstatus = false;
  // direction y
  this.ydirection = 1;
  this.radius = radius;
}

Ball.prototype.move = function() {
  this.hascollided();
  this.dy += this.gravity;
  this.x += this.dx * this.xdirection;
  this.y += this.dy * this.ydirection;
}

Ball.prototype.splitball = function() {
  // explode the ball
  this.splitstatus = true; // update the split status so it doesnt create multiple balls
  // should start high but bounce low (min = height of user)
  // delete current ball
  balls.splice(balls.indexOf(this), 1);
  // split into two balls if big enough
  if (this.radius > 4) {
    var ballone = new Ball(this.x - 20, this.y - 5, (this.radius / 2), 'left', this.ctx);
    var balltwo = new Ball(this.x + 20, this.y - 5, (this.radius / 2), 'right', this.ctx);
    balls.push(ballone);
    balls.push(balltwo);
  }
}

Ball.prototype.hascollided = function() {
  // bounce off ground
  if(this.y + this.radius > 150) {
    this.ydirection = -this.ydirection;
    this.dy += this.gravity;
    // add increase again so next call
    // gets reduced by same amt (symmetry)
    // ie: 1, 2, 3, 3, 2, 1
    this.gravity = -this.gravity;
    //reverse gravity
  }

  // bounce off walls
  if(this.x + this.radius > 300 || this.x + this.radius < 0) {
    this.xdirection = -this.xdirection;
  }

  // touched by spear
  /*var spearxloc = person.weapon.getxlocation();
  var spearyloc = person.weapon.getylocation();

  if ((spearxloc >= (this.x - this.radius)) && (spearxloc <= (this.x + this.radius)) 
      && (spearyloc >= (this.y - this.radius)) && (spearyloc <= (this.y + this.radius))
      && this.splitstatus == false) {
        this.splitball();
  }

  // gotta fix the timing and location of the splitted balls
  if (person.weapon.issolid && ((spearxloc >= (this.x - this.radius)) 
    && (spearxloc <= (this.x + this.radius))) 
    && this.splitstatus == false) {
      this.splitball();
  }    */
}

function update() {
  // update the balls position and shit
  for (var i = 0; i < balls.length; i++) {
    balls[i].move();
  }
}

function init() {
    ball = new Ball(x, y, radius, 'right');
    balls.push(ball);
    // update every 10 ms
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
function updateClients(socket) {
  socket.emit('updateGame', {ball: balls}); 
}
io.sockets.on('connection', function (socket) {
  // start listening to events
  socket.emit('news', { hello: 'world' });
  // first push
  socket.on('getBallPos', function(data) {
    socket.emit('outputBallPos', {ball: balls});
  });
  // Update gameboard every second
  setInterval(function() { socket.emit('updateGame', {ball: balls}); }, 1000);
});

