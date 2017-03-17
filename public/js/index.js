// Connection to socket.io
var socket = io.connect('http://localhost:8080')
  var user = {
    pseudo: '',
    id:''
  }
/*socket.on('connect', function() {
  // user will be an object which will be simplify dev for next features
})*/

      // Update user details
socket.on('updateClient', function (pUser) {
  user = pUser
})

      // Update panel details
socket.on('updateChatList', function (pChatList) {
  var panelTrending = $('#chatList')
  panelTrending.empty()
  for (var key in pChatList) {
    panelTrending.append('<div class="well">' + key + '  <span class="label label-default"> ' + pChatList[key].length + ' <span class="glyphicon glyphicon-user"></span></span></div>')
  }

  var panelEnteredRoom = $('#lobbyListing')
  panelEnteredRoom.empty()
  for(var chat in pChatList){
    for(var chatUser in pChatList[chat]){
      if (chatUser === user.id) {
        panelEnteredRoom.append('<button type="button" class="btn btn-primary">' + chat + '&nbsp;<span class="glyphicon glyphicon-remove"></span></button>')
      }
    }
  }

  var panelUserList = $('#panelUserList')
  panelUserList.empty()
  for (var key in pChatList['The Lobby']) {
    panelUserList.append('<div class="panel-body">' + pChatList['The Lobby'][key] + '</div>')
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
  $('#zone_chat').append('<p><strong>' + pPseudo + '&nbsp;:</strong>&nbsp;' + pMessage + '</p>')
}

function updateListOpenedRoom () {

}

$(document).ready(function () {
        // Show the Modal on load if no pseudo recorded for current user
  if ( user.pseudo === '') {
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
