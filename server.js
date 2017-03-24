var express = require('express')
var app = express()
var server = require('http').createServer(app)
var io = require('socket.io').listen(server)
var rd = require('./randpass') // For generated pseudo
/*
  For jQuery to work in Node, a window with a document is required. Since no such window exists natively in Node,
  one can be mocked by tools such as jsdom. This can be useful for testing purposes.
  Reference : https://www.npmjs.com/package/jquery
*/
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

// Anonymous object storing main data and always sent to update the client interfaces
var chatObject = {
  /*
    - users : array()
        Save each "user object" existing in the whole application
  */
  'users': [],
  /*
    - chats : Anonymous object
        Save each user's ID existing in each chat
  */
  'chats': {
    'The Lobby': [],
    'Supernatural': [],
    'Game of Thrones': [],
    'Frontier': [],
    'Shooter': []
  },
  /**
    @description : Add a user to one or several chat
    @param pId int :  User ID joining chat
    @param pListChat array() : Chat Names
  */
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
  /*
    @description : Remove a user from one or several chat
    @param pId int :  User ID leaving chat
    @param pListChat array() : Chat Names
  */
  userLeave: function (pId, pListChat) {
    pListChat.forEach(function (chat) {
      chatObject.chats[chat].splice($.inArray(pId, chat), 1)
    })
  },
  /*
    @description : Remove user from all chat, when user reload or close page
    @param pId int :  User ID who left
  */
  removeUserById: function (pId) {
    chatObject.users.splice($.inArray(this.getUserById(pId), chatObject.users), 1)
    for (var chat in chatObject.chats) {
      chatObject.chats[chat].splice($.inArray(pId, chatObject.chats[chat]), 1)
    }
  },
  /*
    @description : Get a user object providing only his id
    @param pId int :  User ID
    @return user : object
  */
  getUserById: function (pId) {
    var user
    this.users.forEach(function (element) {
      if (element.id === pId) {
        user = element
      }
    })
    return user
  }
}

// New socket
io.sockets.on('connection', function (pSocket) {
    // As soon as a another client connect
  pSocket.on('newClient', function (pUser) {
    pUser.id = pSocket.id // Set the socket id as the new user id (he'll keep it the whole life cycle)
    // If no valid pseudo, we generate one
    if (pUser.pseudo === '' || pUser.pseudo === null) {
      pUser.pseudo = rd.randpass(8) + ' [' + pSocket.handshake.address + ']'
    }
    pSocket.emit('updateClient', pUser) // Update the senter's user object
    chatObject.users.push(pUser) // Save the new user object
    chatObject.userJoin(pUser.id, ['The Lobby']) // Autojoin "The Lobby" chat
    // Update interfaces information depending the new user arrival
    pSocket.emit('updateChatList', chatObject) // Update sender
    pSocket.broadcast.emit('updateChatList', chatObject) // Update all other sockets
    pSocket.broadcast.emit('noticeUserJoinedRoom', {chat: 'The Lobby', pseudo: pUser.pseudo}) // All other sockets display message for the new arrival "user join the chat ..."
    console.log('### A new user joined ... His name is ' + pUser.pseudo)
  })

  // Add a user to a chat
  pSocket.on('joinChat', function (pChatRoom) {
    chatObject.userJoin(pSocket.id, [pChatRoom])
    pSocket.emit('updateChatList', chatObject)
    pSocket.broadcast.emit('updateChatList', chatObject)
    pSocket.broadcast.emit('noticeUserJoinedRoom', {chat: pChatRoom, pseudo: chatObject.getUserById(pSocket.id).pseudo})
  })

  // Remove a user from a chat
  pSocket.on('leaveChat', function (pChatRoom) {
    chatObject.userLeave(pSocket.id, [pChatRoom])
    pSocket.emit('updateChatList', chatObject)
    pSocket.broadcast.emit('updateChatList', chatObject)
    pSocket.broadcast.emit('noticeUserLeftRoom', {chat: pChatRoom, pseudo: chatObject.getUserById(pSocket.id).pseudo})
  })

  // As soon as we get message, we get pseudo and send message to others by broadcast
  pSocket.on('newMessage', function (pData) {
    pSocket.broadcast.emit('newMessage', {
      chat: pData.chat,
      pseudo: chatObject.getUserById(pSocket.id).pseudo,
      message: pData.message
    })
    console.log('Message a envoyé : ' + chatObject.getUserById(pSocket.id).pseudo + ' | ' + pData.message + ' | ' + pData.chat)
  })

  // Close or Reload page, automatic leave each chat previously joined
  pSocket.on('disconnect', function () {
    console.log('### A user left ... His name was ' + chatObject.getUserById(pSocket.id).pseudo)
    chatObject.removeUserById(pSocket.id)
    pSocket.broadcast.emit('updateChatList', chatObject)
  })
})

server.listen(8080)
