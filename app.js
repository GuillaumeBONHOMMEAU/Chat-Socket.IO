var express=require('express'),
    app = express(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    ent = require('ent'), // Permet de bloquer les caractères HTML (sécurité équivalente à htmlentities en PHP)
    fs = require('fs'),
    rd = require('./randpass'),
    port = process.env.PORT || 8080;

// Run the server
server.listen(port, function () {
    console.log('Server listening at port %d', port);
});

// Load index.html page
app.get('/', function (req, res) {
  res.sendfile(__dirname + '/public/index.html');
});

// Set the default path root of internal ressources to /public
app.use(express.static(__dirname + '/public'));

io.sockets.on('connection', function (socket, pseudo) {
    console.log("New connection");

    // As soon as we get a new client name, we stock it and inform others by broadcast
    socket.on('nouveau_client', function(pseudo) {
        //pseudo = ent.encode(pseudo);
        pseudo = rd.randpass(8);
        socket.pseudo = pseudo;
        socket.broadcast.emit('nouveau_client', pseudo);
    });

    // As soon as we get message, we get pseudo and send message to others by broadcast
    socket.on('message', function (message) {
        // !!! Prevent smiley to display correctly !!!
        //message = ent.encode(message); Encode messgae
        socket.broadcast.emit('message', {pseudo: socket.pseudo, message: message});
    }); 
});

app.post('/test', function (req, res) {
    return rd.randpass(8);
});

server.listen(8080);