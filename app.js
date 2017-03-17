var express = require('express')
var app = express()
var server = require('http').createServer(app)
var io = require('socket.io').listen(server)
var ent = require('ent') // Permet de bloquer les caractères HTML (sécurité équivalente à htmlentities en PHP)
var fs = require('fs')
var rd = require('./randpass')
var session = require('client-sessions')
var port = process.env.PORT || 8080

// Run the server
server.listen(port, function () {
  console.log('Server listening at port %d', port)
})

app.use(session({
  cookieName: 'session',
  secret: 'ahah',
  duration: 30 * 60 * 1000,
  activeDuration: 5 * 60 * 1000
}))

// Load index.html page
app.get('/', function (pReq, pRes) {
  pRes.sendfile(__dirname + '/public/index.html')
})

// Set the default path root of internal ressources to /public
app.use(express.static(__dirname + '/public'))

app.use(function (req, res, next) {
  console.log(req.session.id)
})

var chatObject = {
  'users': [],
  'chats': {
    'The Lobby': [],
    'Supernatural': [],
    'Game of Thrones': [],
    'Frontier': [],
    'Shooter': []
  },
  userJoin: function (pId, pListChat) {
    pListChat.forEach(function (chat) {
      chatObject.chats[chat].push(pId)
    })
  },
  removeUserById: function (pId) {
    for (lobby in this.chats) {
      for (user in lobby) {
        if (user.id === pId) {
          list.push(user)
        }
      }
    }
  },
  getPseudoListByChat: function () {
    var conn = []
    this.chat.forEach(function (data) {
      conn.push(data.pseudo)
    })
    return conn
  },
  getUserById: function (pId) {
    var r = ''
    this.users.forEach(function (user) {
      if (user.id === pId) {
        r = user
      }
    })
    return r
  }
}

var sessionSaved = []

io.sockets.on('connection', function (pSocket) {
    // As soon as we get a new client name, we stock it and inform others by broadcast
  pSocket.on('newClient', function (pUser) {
    pUser.id = pSocket.id
    if (pUser.pseudo === '' || pUser.pseudo === null) {
      pUser.pseudo = rd.randpass(8)
      // client will update details to be compliant
    }
    pSocket.emit('updateClient', pUser)
    chatObject.users.push(pUser)
    chatObject.userJoin(pUser.id, ['The Lobby'])
    pSocket.emit('updateChatList', chatObject)
    pSocket.broadcast.emit('updateChatList', chatObject)
    pSocket.broadcast.emit('newClient', pUser.pseudo)
    console.log('### A new user joined ... His name is ' + pUser.pseudo)
    // chatList.getPseudoList()
  })

  pSocket.on('joinChat', function (pChatRoom) {
    chatObject.userJoin(pSocket.id, [pChatRoom])
    pSocket.emit('updateChatList', chatObject)
    pSocket.broadcast.emit('updateChatList', chatObject)
  })

    // As soon as we get message, we get pseudo and send message to others by broadcast
  pSocket.on('newMessage', function (message) {
    pSocket.broadcast.emit('newMessage', {
      pseudo: chatObject.getUserById(pSocket.id).pseudo,
      message: message
    })
  })

  /* pSocket.on('disconnect',function(){
    var user = chatObject.getUserById(pSocket.id);
    chatObject.removeUserById(pSocket.id);
    console.log(user.pseudo +' disconnected')
  }) */
})

server.listen(8080)
