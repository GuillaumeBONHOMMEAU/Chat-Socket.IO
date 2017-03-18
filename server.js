var express = require('express')
var app = express()
var server = require('http').createServer(app)
var io = require('socket.io').listen(server)
var rd = require('./randpass')
var $
require('jsdom').env('', function (err, window) {
  if (err) {
    console.error(err)
    return
  }

  $ = require('jquery')(window)
})
var port = process.env.PORT || 8080

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
      var isPresent = false
      chatObject.chats[chat].forEach(function (userIdCheck) {
        if (userIdCheck === pId) {
          isPresent = true
        }
      })
      if (isPresent === false) {
        chatObject.chats[chat].push(pId)
      }
    })
  },
  userLeave: function (pId, pListChat) {
    pListChat.forEach(function (chat) {
      chatObject.chats[chat].splice($.inArray(pId, chat), 1)
    })
  },
  removeUserById: function (pId) {
    chatObject.users.splice($.inArray(this.getUserById(pId), chatObject.users), 1)
    chatObject.chats.forEach(function (chat) {
      chatObject.chats[chat].splice($.inArray(pId, chatObject.chats[chat]), 1)
    })
  },
  getPseudoListByChat: function () {
    var conn = []
    this.chat.forEach(function (data) {
      conn.push(data.pseudo)
    })
    return conn
  },
  getUserById: function (pId) {
    var r
    this.users.forEach(function (user) {
      if (user.id === pId) {
        r = user
      }
    })
    return r
  }
}

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

  pSocket.on('leaveChat', function (pChatRoom) {
    chatObject.userLeave(pSocket.id, [pChatRoom])
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
})

server.listen(8080)
