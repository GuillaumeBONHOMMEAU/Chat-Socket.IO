const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const rd = require('./randpass'); // For generated pseudo
const { JSDOM } = require('jsdom');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let $;
const dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`);
$ = require('jquery')(dom.window);

const port = process.env.PORT || 8080;
const PUBLIC_IP_ADDRESS = '90.49.98.96';

// Run the server
server.listen(port, () => {
  console.log(`Server listening at port ${port}`);
});

// Load index.html page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Set the default path root of internal resources to /public
app.use(express.static(path.join(__dirname, 'public')));

// Anonymous object storing main data and always sent to update the client interfaces
const chatObject = {
  users: [],
  chats: {
    'The Lobby': [],
    'Supernatural': [],
    'Game of Thrones': [],
    'Frontier': [],
    'Shooter': []
  },
  userJoin(pId, pListChat) {
    pListChat.forEach(chat => {
      if (!chatObject.chats[chat].includes(pId)) {
        chatObject.chats[chat].push(pId);
      }
    });
  },
  userLeave(pId, pListChat) {
    pListChat.forEach(chat => {
      const index = chatObject.chats[chat].indexOf(pId);
      if (index !== -1) {
        chatObject.chats[chat].splice(index, 1);
      }
    });
  },
  removeUserById(pId) {
    const userIndex = chatObject.users.findIndex(user => user.id === pId);
    if (userIndex !== -1) {
      chatObject.users.splice(userIndex, 1);
    }
    for (const chat in chatObject.chats) {
      const index = chatObject.chats[chat].indexOf(pId);
      if (index !== -1) {
        chatObject.chats[chat].splice(index, 1);
      }
    }
  },
  getUserById(pId) {
    return chatObject.users.find(user => user.id === pId);
  }
};

// New socket
io.on('connection', socket => {
  socket.on('newClient', pUser => {
    pUser.id = socket.id;
    pUser.ip = socket.handshake.address === '::1' ? PUBLIC_IP_ADDRESS : socket.handshake.address;
    if (!pUser.pseudo) {
      pUser.pseudo = `${rd.randpass(8)} [${pUser.ip}]`;
    }
    socket.emit('updateClient', pUser);
    chatObject.users.push(pUser);
    chatObject.userJoin(pUser.id, ['The Lobby']);
    socket.emit('updateChatList', chatObject);
    socket.broadcast.emit('updateChatList', chatObject);
    socket.broadcast.emit('noticeUserJoinedRoom', { chat: 'The Lobby', pseudo: pUser.pseudo });
    console.log(`### A new user joined ... His name is ${pUser.pseudo}`);
  });

  socket.on('joinChat', pChatRoom => {
    chatObject.userJoin(socket.id, [pChatRoom]);
    socket.emit('updateChatList', chatObject);
    socket.broadcast.emit('updateChatList', chatObject);
    socket.broadcast.emit('noticeUserJoinedRoom', { chat: pChatRoom, pseudo: chatObject.getUserById(socket.id).pseudo });
  });

  socket.on('leaveChat', pChatRoom => {
    chatObject.userLeave(socket.id, [pChatRoom]);
    socket.emit('updateChatList', chatObject);
    socket.broadcast.emit('updateChatList', chatObject);
    socket.broadcast.emit('noticeUserLeftRoom', { chat: pChatRoom, pseudo: chatObject.getUserById(socket.id).pseudo });
  });

  socket.on('newMessage', pData => {
    socket.broadcast.emit('newMessage', {
      chat: pData.chat,
      pseudo: chatObject.getUserById(socket.id).pseudo,
      message: pData.message
    });
    console.log(`Message sent: ${chatObject.getUserById(socket.id).pseudo} | ${pData.message} | ${pData.chat}`);
  });

  socket.on('disconnect', () => {
    const user = chatObject.getUserById(socket.id);
    if (user) {
      console.log(`### A user left ... His name was ${user.pseudo}`);
      chatObject.removeUserById(socket.id);
      socket.broadcast.emit('updateChatList', chatObject);
    }
  });
});