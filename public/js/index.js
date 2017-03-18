// Connection to socket.io
var socket = io.connect('http://localhost:8080')
var user = {
  pseudo: '',
  id: ''
}

      // Update user details
socket.on('updateClient', function (pUser) {
  user = pUser
})

      // Update panel details
socket.on('updateChatList', function (pChatList) {
  var panelTrending = $('#chatList')
  panelTrending.empty()
  for (var chat in pChatList.chats) {
    panelTrending.append('<div class="well" onclick="joinChat(\'' + chat + '\')">' + chat + '  <span class="label label-default"> ' + pChatList.chats[chat].length + ' <span class="glyphicon glyphicon-user"></span></span></div>')
  }

  var panelEnteredRoom = $('#lobbyListing')
  panelEnteredRoom.empty()
  for (var chat in pChatList.chats) {
    for (var chatUser in pChatList.chats[chat]) {
      if (pChatList.chats[chat][chatUser] === user.id) {
        panelEnteredRoom.append('<div id="labelChat_' + chat.replace(new RegExp(' ', 'g'), '') + '" onclick="selectChat(\'' + chat + '\')" class="btn btn-primary">' + chat + '&nbsp;<span class="glyphicon glyphicon-remove" onclick="leaveChat(\'' + chat + '\')"></span></div>')
      }
    }
  }

  var panelUserList = $('#panelUserList')
  panelUserList.empty()
  for (var userId in pChatList.chats['The Lobby']) {
    var lUser = ''
    pChatList.users.forEach(function (element) {
      if (element.id === pChatList.chats['The Lobby'][userId]) {
        lUser = element
      }
    })
    if (lUser.pseudo === null || lUser.pseudo === 'undefined') {
      lUser.pseudo = 'Visiteur'
    }
    panelUserList.append('<div class="panel-body" id="' + lUser.id + '">' + lUser.pseudo + '</div>')
  }
})

      // Display while receive message
socket.on('newMessage', function (pData) {
  insereMessage(pData.pseudo, pData.message)
})

      // Log while connecting
socket.on('newClient', function (pPseudo) {
  $('#zone_chat').append('<p class="alert alert-info"><em>' + pPseudo + ' a rejoint le Chat !</em></p>')
})

      // Form sending then printing message
function writing (event) {
        // If key enter pressed
  if (event.which === 13 || event.keyCode === 13) {
    var message = document.getElementById('message').parentNode.textContent
    socket.emit('newMessage', message) // Broadcast emit
    insereMessage(user.pseudo, message) // Display message
    document.getElementsByClassName('emoji-wysiwyg-editor')['message'].textContent = ''
    return false
  }
}

      // Ajoute un message dans la page
function insereMessage (pPseudo, pMessage) {
  var activeLabel = $('#lobbyListing .btn-default')
  $('#chatZone' + activeLabel.attr('id').substring(9)).append('<p><strong>' + pPseudo + '&nbsp;:</strong>&nbsp;' + pMessage + '</p>')
}

function joinChat (pChatName) {
  socket.emit('joinChat', pChatName)

  var chatName = pChatName.replace(new RegExp(' ', 'g'), '')
  if (!$('#labelChat_' + chatName).length) {
    $('#panelChatZone').prepend('<section id="chatZone_' + chatName + '"></section>')
  }

  selectChat(pChatName)
}

function leaveChat (pChatName) {
  socket.emit('leaveChat', pChatName)
  $('#chatZone_' + pChatName.replace(new RegExp(' ', 'g'), '')).remove()
}

function selectChat (pChatName) {
  var oldLabel = $('#lobbyListing .btn-default')
  oldLabel.removeClass('btn-default')
  oldLabel.addClass('btn-primary')

  var newLabel = $('#labelChat_' + pChatName.replace(new RegExp(' ', 'g'), ''))
  newLabel.removeClass('btn-primary')
  newLabel.addClass('btn-default')

  $('#panelChatZone section').css('display', 'none')
  $('#chatZone_' + pChatName.replace(new RegExp(' ', 'g'), '')).css('display', 'block')
}

$(document).ready(function () {
        // Show the Modal on load if no pseudo recorded for current user
  if (user.pseudo === '') {
    $('#myModal').modal('show')

        // join form submit
    $('#btnJoin').click(function () {
            // Request nickname to send it to server
      user.pseudo = $('#own').val()
      socket.emit('newClient', user)
      $('#myModal').modal('hide')
    })
  }

          // Initializes and creates emoji set from sprite sheet
  window.emojiPicker = new EmojiPicker({
    emojiable_selector: '[data-emojiable=true]',
    assetsPath: 'lib/img/',
    popupButtonClasses: 'fa fa-smile-o'
  })
        // Finds all elements with `emojiable_selector` and converts them to rich emoji input fields
        // You may want to delay this step if you have dynamically created input fields that appear later in the loading process
        // It can be called as many times as necessary; previously converted input fields will not be converted again
  window.emojiPicker.discover()
})
