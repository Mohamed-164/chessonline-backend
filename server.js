// Modules
const http = require('http');
const express = require('express');
const app = express();
const server = http.createServer(app);

// Custom Modules
const {generateNum,playerColor,codes} = require('./generate');
const {currengame,GameSession,boardsetupData} = require('./currentGame');
const PORT = process.env.PORT || 3000;

// Declaration start from here

const Sockets = {}; // Store connected sockets


const io = require("socket.io")(server, {
  cors: {
    origin: "https://chessonline-frontend.vercel.app/",
    methods: ["GET", "POST"]
  }
});


io.on('connection', (socket) => {
  console.log('New socket connected:', socket.id);
  Sockets[socket.id] = socket;

socket.on('connect', () => {
  console.log('Socket connected:', socket.id);
});

socket.on('resign',(resignobj) => {
  if(currengame.hasOwnProperty(resignobj.code)){
    if(resignobj.mycolor == "white"){
      let oppenentID = currengame[resignobj.code].black;
      Sockets[oppenentID].emit('resigned');
    }else if(resignobj.mycolor == "black"){
      let oppenentID = currengame[resignobj.code].white;
      Sockets[oppenentID].emit('resigned');
    }
      if(codes.includes(Number(resignobj.code))){
        codes.splice(codes.indexOf(Number(resignobj.code)),1);
      }
    delete currengame[resignobj.code]; 
  }
});

socket.on('move',(moveData) => {
  if(currengame.hasOwnProperty(moveData.code)){
    if(moveData.mycolor == "white"){
      let oppenentID = currengame[moveData.code].black;
        Sockets[oppenentID].emit('move',moveData);
    }else if(moveData.mycolor == "black"){
      let oppenentID = currengame[moveData.code].white;
        Sockets[oppenentID].emit('move',moveData);
    }
  } 
});

socket.on('capture',(piececaptured) => {
  if(currengame.hasOwnProperty(piececaptured.code)){
    if(piececaptured.mycolor == "white"){
      let oppenentID = currengame[piececaptured.code].black;
      Sockets[oppenentID].emit('captured',piececaptured);
    }else if(piececaptured.mycolor == "black"){
      let oppenentID = currengame[piececaptured.code].white;
      Sockets[oppenentID].emit('captured',piececaptured);
    }
  } 
});

socket.on('castling',(castlingobj) => {
  if(currengame.hasOwnProperty(castlingobj.code)){
    if(castlingobj.mycolor == "white"){
      let oppenentID = currengame[castlingobj.code].black;
      Sockets[oppenentID].emit('castled');
    }else if(castlingobj.mycolor == "black"){
      let oppenentID = currengame[castlingobj.code].white;
      Sockets[oppenentID].emit('castled');
    }
  } 
});

socket.on('AvailableGame', (userCode) =>{
   
  if(currengame.hasOwnProperty(userCode)){
    if(currengame[userCode].white && currengame[userCode].black){
      socket.emit('gameNotExists');
    }
    else if(currengame[userCode].white || currengame[userCode].black){

      if(!currengame[userCode].white){
        currengame[userCode].waiting = false;
        currengame[userCode].white = socket.id;

        let whiteboarddata = new boardsetupData(userCode,currengame[userCode].mode,'white');
        let blackboarddata = new boardsetupData(userCode,currengame[userCode].mode,'black');
        let blacksocketID = currengame[userCode].black;

        socket.emit('boardSetup',whiteboarddata);
        Sockets[blacksocketID].emit('boardSetup',blackboarddata);

      }else{

        currengame[userCode].black = socket.id;
        currengame[userCode].waiting = false;
        let whiteboarddata = new boardsetupData(userCode,currengame[userCode].mode,'white');
        let blackboarddata = new boardsetupData(userCode,currengame[userCode].mode,'black');
        let whitesocketID = currengame[userCode].white;

        socket.emit('boardSetup',blackboarddata);
        Sockets[whitesocketID].emit('boardSetup',whiteboarddata);
      }
    }
  }else{
    socket.emit('gameNotExists');
  }

});  

socket.on('createCode', (mode) => {

  let code = generateNum();
  let color = playerColor();

  if(color == "white"){
    currengame[code] = new GameSession(Number(mode),socket.id,null);
  }else{
    currengame[code] = new GameSession(Number(mode),null,socket.id);
  }

  setTimeout(() => {
    if (currengame.hasOwnProperty(code)) {
      if(currengame[code].waiting){
        if(!currengame[code].white || !currengame[code].black){
          if(codes.includes(code)){
            codes.splice(codes.indexOf(code),1);
          }
          socket.emit('connect_timeout');
          delete currengame[code];
        }
      }
    }
  }, 1000 * 60); 

  socket.emit('code',code);
});

socket.on('gameover',(gamecode) => {
  if(currengame.hasOwnProperty(gamecode)){
      if(codes.includes(Number(gamecode))){
        codes.splice(codes.indexOf(Number(gamecode)),1);
      }
    delete currengame[gamecode];
  }
});

socket.on('disconnect', () => {
  console.log('Socket disconnected:', socket.id);
  delete Sockets[socket.id];

  for (let gameCode in currengame) {
    if (Object.prototype.hasOwnProperty.call(currengame, gameCode)) {
      const game = currengame[gameCode];
      let code = Number(gameCode);
      if(codes.includes(code)){
        codes.splice(codes.indexOf(code),1);
      }
      if (game.white === socket.id) {

        const blackSocket = Sockets[game.black];
        if (blackSocket) {
          blackSocket.emit('opponentLeft');
        }
        delete currengame[gameCode]; // clean up game
        break;

      }

      if (game.black === socket.id) {

        const whiteSocket = Sockets[game.white];
        if (whiteSocket) {
          whiteSocket.emit('opponentLeft');
        }
        delete currengame[gameCode]; // clean up game
        break;
      }
    }
  }
});

});


server.listen(PORT);



