// Connection to socket.io
var socket = io.connect('http://localhost:8080')
var user = {
  pseudo: '',
  id: '',
  chatJoined: []
}
var hasAutojoined = false
var chatToJoin = null

      // Update user details
socket.on('updateClient', function (pUser) {
  user = pUser
})

      // Update panels details
socket.on('updateChatList', function (pChatList) {
  updatePanelTrending(pChatList)
  updateLobbyListing(pChatList)
  updatePanelUserList(pChatList)
})

      // Display while receive message
socket.on('newMessage', function (pData) {
  // alert('newMessage : ' + pData.chat + ' | ' + pData.pseudo + ' | ' + pData.message)
  var labelChatConcerned = $('.btn').filter(function (index) { return $(this).text() === pData.chat })
  if (labelChatConcerned != null) {
    $('#chatZone_' + pData.chat.replace(new RegExp(' ', 'g'), '')).append('<p><strong>' + pData.pseudo + '&nbsp;:</strong>&nbsp;' + pData.message + '</p>')
  }
})

      // Log while connecting
socket.on('noticeUserJoinedRoom', function (pData) {
  // alert('userJoinRoom : ' + pData.chat + ' | ' + pData.pseudo)
  user.chatJoined.forEach(function (chatJoined) {
    if (chatJoined === pData.chat) {
      $('#chatZone_' + pData.chat.replace(new RegExp(' ', 'g'), '')).append('<p class="alert alert-info"><em>' + pData.pseudo + ' a rejoint le Chat !</em></p>')
    }
  })
})

socket.on('noticeUserLeftRoom', function (pData) {
  // alert('userLeftRoom : ' + pData.chat + ' | ' + pData.pseudo)
  user.chatJoined.forEach(function (chatJoined) {
    if (chatJoined === pData.chat) {
      $('#chatZone_' + pData.chat.replace(new RegExp(' ', 'g'), '')).append('<p class="alert alert-warning"><em>' + pData.pseudo + ' a quitté le Chat !</em></p>')
    }
  })
})

      // Form sending then printing message
function writing (event) {
        // If key enter pressed
  if (event.which === 13 || event.keyCode === 13) {
    var message = $('#formulaire_chat div.emoji-wysiwyg-editor').text()
    socket.emit('newMessage', {'message': message, 'chat': $('#lobbyListing .btn-default').text()}) // Broadcast emit

    var activeLabel = $('#lobbyListing .btn-default')
    var labelId = activeLabel.attr('id') || 'chatZone_TheLobby'
    var colorText = $('input.colorpicker-element').val() != null ? $('input.colorpicker-element').val() : 'black'
    $('#chatZone' + labelId.substring(9)).append('<p style="color: ' + colorText + '"><strong style="color: #333">' + user.pseudo + '&nbsp;:</strong>&nbsp;' + message + '</p>')

    document.getElementsByClassName('emoji-wysiwyg-editor')['message'].textContent = ''
    return false
  }
}

function updatePanelTrending (pChatList) {
  var panelTrending = $('#chatList')
  panelTrending.empty()
  for (var chat in pChatList.chats) {
    panelTrending.append('<div class="well" onclick="joinChat(\'' + chat + '\')">' + chat +
      '  <span class="label label-default"> ' + pChatList.chats[chat].length + ' <span class="glyphicon glyphicon-user"></span></span></div>')
  }
}

function updateLobbyListing (pChatList) {
  var panelEnteredRoom = $('#lobbyListing')
  var selectedChat = $('#lobbyListing .btn-default').text()
  panelEnteredRoom.empty()

  if (!hasAutojoined) {
    panelEnteredRoom.append('<div id="labelChat_TheLobby' + '" onclick="selectChat(\'The Lobby\')" class="btn btn-default">' +
      'The Lobby<span class="glyphicon glyphicon-remove" onclick="leaveChat(\'The Lobby\')"></span></div>')
    // joinChat('The Lobby')
    hasAutojoined = true
  } else {
    for (var chat in pChatList.chats) {
      for (var chatUser in pChatList.chats[chat]) {
        if (pChatList.chats[chat][chatUser] === user.id) {
          var divClass
          if (chatToJoin !== null) {
            divClass = chatToJoin === chat ? 'btn-default' : 'btn-primary'
          } else if (selectedChat != null && selectedChat === chat) {
            divClass = 'btn-default'
          }
          divClass = divClass == null ? 'btn-primary' : divClass
          panelEnteredRoom.append('<div id="labelChat_' + chat.replace(new RegExp(' ', 'g'), '') + '" onclick="selectChat(\'' + chat + '\')" class="btn ' + divClass + '">' +
            chat + '<span class="glyphicon glyphicon-remove" onclick="leaveChat(\'' + chat + '\')"></span></div>')
        }
      }
    }
    chatToJoin = null
  }
}

function updatePanelUserList (pChatList) {
  var panelUserList = $('#panelUserList')
  var selectedChat = $('#lobbyListing .btn-default').text() != null ? $('#lobbyListing .btn-default').text() : 'The Lobby'
  // alert(selectedChat)
  panelUserList.empty()

  for (var userId in pChatList.chats[selectedChat]) {
    var lUser = ''
    pChatList.users.forEach(function (element) {
      if (element.id === pChatList.chats['The Lobby'][userId]) {
        lUser = element
      }
    })
    panelUserList.append('<div class="panel-body" id="' + lUser.id + '">' + lUser.pseudo + '</div>')
  }
}

function joinChat (pChatName) {
  var isChatJoined = false
  user.chatJoined.forEach(function (chatJoined) {
    if (pChatName === chatJoined) {
      isChatJoined = true
    }
  })

  if (isChatJoined === false) {
    user.chatJoined.push(pChatName)
    $('#panelChatZone').prepend('<section id="chatZone_' + pChatName.replace(new RegExp(' ', 'g'), '') + '"></section>')
    socket.emit('joinChat', pChatName)
  }

  chatToJoin = pChatName
  selectChat(pChatName)
}

function leaveChat (pChatName) {
  if ($('#lobbyListing .btn-default').text() === pChatName) {
    var lastChat = $('#lobbyListing .btn-primary').last()
    chatToJoin = lastChat.text()
  } else {
    chatToJoin = $('#lobbyListing .btn-default').text()
  }

  user.chatJoined.splice($.inArray(pChatName, user.chatJoined), 1)
  $('#chatZone_' + pChatName.replace(new RegExp(' ', 'g'), '')).remove()
  socket.emit('leaveChat', pChatName)
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

  var demo4 = $('.colorpickerplus-dropdown .colorpickerplus-container')
  demo4.colorpickerembed()
  demo4.on('changeColor', function (e, color) {
    var el = $('.color-fill-icon', $('#demo4'))
    if (color == null) {
        // when select transparent color
      el.addClass('colorpicker-color')
    } else {
      el.removeClass('colorpicker-color')
      el.css('background-color', color)
    }
  })

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
