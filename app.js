var express = require('express')
var app = express()
var server = require('http').createServer(app)
var io = require('socket.io').listen(server)
var ent = require('ent') // Permet de bloquer les caractères HTML (sécurité équivalente à htmlentities en PHP)
var fs = require('fs')
var rd = require('./randpass')
var port = process.env.PORT || 8080

var chatList = {'The Lobby': [],
  'Supernatural': [],
  'Game of Thrones': [],
  'Frontier': [],
  'Shooter': []}

// Run the server
server.listen(port, function () {
  console.log('Server listening at port %d', port)
})

// Load index.html page
app.get('/', function (pReq, pRes) {
  pRes.sendfile(__dirname + '/public/index.html')
})

// Set the default path root of internal ressources to /public
app.use(express.static(__dirname + '/public'))

io.sockets.on('connection', function (pSocket) {
    // As soon as we get a new client name, we stock it and inform others by broadcast
  pSocket.on('newClient', function (user) {
    pSocket.user = user
    if (pSocket.user.pseudo === '' || pSocket.user.pseudo === null) {
      pSocket.user.pseudo = rd.randpass(8)
      // client will update details to be compliant
      pSocket.emit('updateClient', pSocket.user)
    }
    chatList['The Lobby'].push(pSocket.user)
    pSocket.emit('updateChatList', chatList)
    pSocket.broadcast.emit('newClient', pSocket.user.pseudo)
    console.log('### A new user joined ... His name is ' + pSocket.user.pseudo)
  })

  pSocket.on('joinChat', function (pChatRoom) {
    chatList[pChatRoom].push(pSocket.user)
    pSocket.emit('updateChatList', chatList)
  })

    // As soon as we get message, we get pseudo and send message to others by broadcast
  pSocket.on('newMessage', function (message) {
        // !!! Prevent smiley to display correctly !!!
        // message = ent.encode(message); Encode messgae
    pSocket.broadcast.emit('newMessage', {pseudo: pSocket.user.pseudo, message: message})
  })
})

server.listen(8080)
