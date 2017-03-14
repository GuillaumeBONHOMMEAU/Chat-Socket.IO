// Connection to socket.io
var socket = io.connect('http://localhost:8080')
var user = {
  pseudo: '',
  chat: ['lobby']
}

      // Update user details
socket.on('updateClient', function (pUser) {
  user = pUser
})

socket.on('updateChatList', function (pChatList) {
  var panel = $('#chatList')
  panel.empty()
  pChatList.forEach(function (chat) {
    panel.append('<div class="well">' + chat + '  <span class="label label-default"> 0 <span class="glyphicon glyphicon-user"></span></span></div>')
  })
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
        // Show the Modal on load
  $('#myModal').modal('show')
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

        // join form submit
  $('#btnJoin').click(function () {
          // Request nickname to send it to server
    user.pseudo = $('#own').val()
    socket.emit('newClient', user)
    $('#myModal').modal('hide')
  })
})
