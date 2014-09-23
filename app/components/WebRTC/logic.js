var client = io({url:'http://localhost'});
var webrtc = WebRTC();
var signaller = Signaller();
var rtc = RTC(webrtc, signaller);

var user = Math.floor(Math.random()*100);
webrtc.setId(user);
var socket = signaller.socket;
console.log(socket);
//register self
socket.on('connect', function(){
  socket.emit('user-ready', {username:user});
});


socket.on('new-user', function(data){
  console.log('received new peer');
  addNew(data.username);
});

socket.on('users', function(data){
  console.log(data);
  data.forEach(function(user){
    addNew(user);
  });
});

function addNew(user){
  webrtc.addUser(user);
  rtc.newPeer(user);
  checkIfReady(user);
}
checkConnections();

//Checks all rtc connections to see if they are up and ready
//for signalling, checks all users every 30 seconds
function checkConnections(){
  var users = webrtc.getAllUsers();
  console.log(users);
  users.forEach(function(username){
    checkIfReady(username);
  });
  setTimeout(function(){
    checkConnections();
  },30000);
}


/*
  look into promises are alternatives to using set timeout in func below
*/
//Checks if an rtc stream has an attached local stream object, 
//local stream must attached before signalling can begin 
//Checks for remote stream, if one is present, no need for resignalling
function checkIfReady(user){
    var peer = webrtc.getRTC(user);
    var localStream = webrtc.getMyInfo().stream;
    console.log('Checking', user);
    if( localStream !== null){
      var vid = document.getElementById('me');
      if(vid.src.length < 1){
        attachMediaStream(vid, localStream);
      }
      //Check if rtc connection has a local stream attached
      if(peer.getLocalStreams().length < 1){
        peer.addStream(localStream);
      }

      //Check if rtc connection does not have a remote stream attached
      if(peer.getRemoteStreams().length < 1){
        console.log('send req for remote');
        
        //Let peer know we are ready to begin signalling
        signaller.send('ready', {
          from: webrtc.getMyInfo().id,
          to:user,
        });
        peer.ready = true;
        setTimeout(function(){
          if(user !== undefined || user !== null){
            checkIfReady(user);
          }
        }, 15000);
      } else {
        peer.processIce();
        var src = createVidElements(webrtc.getStream(user));
        appendToMeeting(src);
        return;
      }
      //Mark this peer as ready to begin signalling
      
    } else {
      console.log('No local stream');
      setTimeout(function(){
        if(user !== undefined || user !== null){
            checkIfReady(user);
        }
      }, 1000);
    }
  
}

function createVidElements(user){
  var stream = webrtc.getStream(user);
  var elem = toSrcElem(stream);
  return elem;
}

function appendToMeeting(element){
  var elem = document.createElement('video');
  document.getElementById('meeting-space')
    .appendChild(elem);
    elem.appendChild(element);
}

function getAllUserNames(){
  return webrtc.users;
}