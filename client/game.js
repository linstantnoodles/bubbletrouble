function Game(clientId) {
  this.currentTime = (new Date()).getTime();
  this.dt = 1/60; // frames per second.
  this.accumulator = 0;
  this.balls = {};
  this.players = {};
  this.spears = {};
  this.gameSocket;
  this.soundManager;
  this.clientId = clientId;
}

Game.prototype.getPlayers = function() {
  return this.players;
}

Game.prototype.start = function() {
  // start running the animation
  this.soundManager = new SoundManager();
  this.soundManager.init();
  this.soundManager.playBackGroundMusic();
  this.setUpKeys();
  this.animate();
}

Game.prototype.setUpKeys = function() {
  var _this = this;

  var keyboard = {
    SPACE: 32,
    W: 65,
    D: 68,
    L: 108,
  }

  // Listeners
  $(document).keypress(function(event) {
    if (event.charCode == keyboard.L) {
      _this.gameSocket.emit('addBall');
    }
    if (event.charCode == keyboard.SPACE) {
      _this.gameSocket.emit('fireSpear');
      _this.soundManager.playGunFire();
      _this.players[_this.clientId].fireSpear();
    }
  });

  $(document).keydown(function(event) {
    if (event.which == keyboard.W) {
      _this.players[_this.clientId].moveLeft();
      _this.gameSocket.emit('playerMoveLeft');
    }
    if (event.which == keyboard.D) {
      _this.players[_this.clientId].moveRight();
      _this.gameSocket.emit('playerMoveRight');
    }
  });

  $(document).keyup(function(event) {
    if(event.which == keyboard.W) {
      _this.players[_this.clientId].stopMoving();
      _this.gameSocket.emit('playerStopMoving');
    }
    if(event.which == keyboard.D) {
      _this.players[_this.clientId].stopMoving();
      _this.gameSocket.emit('playerStopMoving');
    }
  });

}

// TODO: needs to be simplified
Game.prototype.updatePhysics = function(timeUpdate) {
  // TODO: remove duplication
  var timeNow = timeUpdate || (new Date()).getTime();
  for (var i in this.balls) {
    var delta = (timeNow - this.balls[i].currentTime) / 1000; //convert to seconds
    this.balls[i].currentTime = timeNow;
    this.balls[i].accum += delta;
    while (this.balls[i].accum >= this.dt){
      this.balls[i].accum -= this.dt;
      this.balls[i].move(this.dt);
    }
  }

  for (var i in this.spears) {
    var delta = (timeNow - this.spears[i].currentTime) / 1000; //convert to seconds
    this.spears[i].currentTime = timeNow;
    this.spears[i].accum += delta;
    while (this.spears[i].accum >= this.dt){
      this.spears[i].accum -= this.dt;
      this.spears[i].update(this.dt);
    }
  }

  for (var i in this.players) {
    var delta = (timeNow - this.players[i].currentTime) / 1000; //convert to seconds
    this.players[i].currentTime = timeNow;
    this.players[i].accum += delta;
    while (this.players[i].accum >= this.dt){
      this.players[i].accum -= this.dt;
      this.players[i].updatePosition(this.dt);
    }
  }

}

Game.prototype.draw = function() {
  this.updatePhysics();
  // now render the actual display
  canvas.getContext().clearRect(0, 0, canvas.getWidth(), canvas.getHeight());
  for(var i in this.players) {
    this.players[i].draw();
  }
  for(var i in this.balls) {
    this.balls[i].draw();
  }
  for(var i in this.spears) {
    this.spears[i].draw();
  }
}

Game.prototype.animate = function() {
  var _this = this;
  requestAnimFrame( function() { _this.animate(); }  );
  _this.draw();
}

Game.prototype.createSocket = function(gameroom) {
  var _this = this;
  _this.gameSocket = gameroom;
  // Set up socket data
  gameroom.on('firstUpdate', function(data) {
    // On first receive, set the currenttime to time of receipt
    _this.updateBalls(data.balls);
    _this.updatePlayers(data.players);
    _this.updateSpears(data.spears);
  });

  gameroom.on('gameFull', function(data) {
    alert("Sorry, the game is full :)");
  });

  gameroom.on('updatePlayers', function(data) {
    _this.updatePlayers(data.players);
  });

  gameroom.on('killPlayer', function(data) {
    _this.killPlayer(data.pid);
  });

  gameroom.on('updateSpear', function(data) {
    _this.updateSpears(data.spears);
  });

  gameroom.on('updateBalls', function(data) {
    console.log("Updating balls");
    _this.soundManager.playBubblePopSound();
    _this.updateBalls(data.balls);
  });

  gameroom.on('collide', function(data) {
    _this.updateBalls(data.balls);
  });

}

Game.prototype.updateBalls = function(newBalls) {
  // doesnt account for deleted balls
  // reset the time
  for (var i in this.balls) {
    if(!newBalls[i]) delete this.balls[i];
  }
  for (var i in newBalls) {
    // TODO: we must account for latency
    var ballData = newBalls[i];
    if(!this.balls[i]) {
      var config = {
        x: ballData.x,
        y: ballData.y,
        dx: ballData.dx,
        dy: ballData.dy,
        color: Ball.getBallColor(ballData.radius),
        gravity: ballData.gravity,
        xdirection: ballData.xdirection,
        splitstatus: ballData.splitstatus,
        ydirection: ballData.ydirection,
        radius: ballData.radius,
      };
      var newBall = new Ball(ballData.x, ballData.y, ballData.radius, ballData.dy, 'right', canvas.getContext(), config);
      this.balls[i] = newBall;
    }
  }
}

Game.prototype.updatePlayers = function(newPlayers) {
  console.log("updating player Postition");
  for(var i in newPlayers) {
    var playerData = newPlayers[i];
    var config = {
      x: playerData.x,
      y: playerData.y,
      dx: playerData.dx,
      state: playerData.state,
      color: playerData.color,
    }
    if (!this.players[i]) {
      console.log("Creating new player");
      var newPlayer = new Player(0, 0, canvas.getContext(), config);
      this.players[i] = newPlayer;
    } else {
      console.log("Updating existing players");
      this.players[i].updatePlayer(config);
    }
  }
}

Game.prototype.killPlayer = function(pid) {
  console.log("killing player: " + pid);
  if (this.players[pid]) {
    this.players[pid].die();
  }
}

Game.prototype.updateSpears = function(newSpears) {
  // this should actually come back with the id
  for (var i in newSpears) {
    var spearData = newSpears[i];
    var config = {
      startTime : spearData.startTime,
      animateSpear : spearData.animateSpear,
      lineStartTime : spearData.lineStartTime,
      lineLifeTime : spearData.lineLifeTime,
      dy: spearData.dy,
      amplitude: spearData.amplitude,
      period: spearData.period,
      myDot : spearData.myDot,
      tipIndex : spearData.tipIndex,
      isSolid : spearData.isSolid,
      history : spearData.history,
      ownerId : i,
    }
    if(!this.spears[i]) {
      var newSpear = new Spear(canvas.getContext(), 0, 0, config);
      console.log("Adding new spear");
      this.spears[i] = newSpear;
    } else {
      this.spears[i].updateState(config);
    }
  }
}


