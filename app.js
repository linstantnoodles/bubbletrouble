var app = require('express').createServer();
var io = require('socket.io').listen(app);

app.listen(80);

app.get('/', function(req, res) {

