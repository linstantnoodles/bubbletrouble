var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , fs = require('fs')

app.listen(5000);

// This will get incremented every second
var mainValue = 0;
function logIt() {
    console.log(mainValue);
    mainValue++;
}
function increaseByOne() {
    setInterval(logIt, 1000);
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

// call the timer
increaseByOne();

io.sockets.on('connection', function (socket) {
  // start listening to events
  socket.emit('news', { hello: 'world' });
  socket.on('my other event', function (data) {
    console.log(data);
  });

  socket.on('getCount', function(data) {
      socket.emit('outputCount', {time: mainValue});
    console.log("Nigga tryna get mah count!");
  });

});

