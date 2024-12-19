const express = require('express');
const app = express();

const {createServer} = require('http');
const {Server} = require('socket.io');
const path = require('path');
const { match } = require('assert');
const httpServer = createServer(app);

const io = new Server(httpServer,{
    cors: {
        origin: "*",
        methods: ["*"],
      }
    
});

app.get('/',(req,res)=> {
    res.send("<h1>Working</h1>")
})
let player = [];
let TotalPlayers = 0;
let waitingPlayer = [];
let matches=[];
function playerJoin(socketid) {
    player.push({id: TotalPlayers+1, socketid: socketid });
    TotalPlayers++;
    io.emit("updatedPlayerCount",TotalPlayers);
   
    
}

function createMatch() {
    const socketid1 = waitingPlayer[0];
    const socketid2 = waitingPlayer[1];
    waitingPlayer = waitingPlayer.filter(item => item !== socketid1);
    waitingPlayer = waitingPlayer.filter(item => item !== socketid2);

    matches.push({id1:socketid1,id2:socketid2});

    // Emit only to the players involved in the match
    io.to(socketid1).emit("Match_Made", {socketid1, socketid2});
    io.to(socketid2).emit("Match_Made", {socketid1, socketid2});

}
function playerDisconnect(socketid) {
    const playerLength = player.length;
     player = player.filter(item => item.socketid !== socketid);
     const playerNewLength = player.length;
     const waitlength = waitingPlayer.length;
 
     if (playerLength === playerNewLength) {
         waitingPlayer = waitingPlayer.filter(item => item !== socketid);
 
         // Emit disconnect only if the player is part of a match
         for (let i = 0; i < matches.length; i++) {
             if (String(matches[i].id1) === String(socketid) || String(matches[i].id2) === String(socketid)) {
                console.log(matches);
                
                 io.emit("playerDisconnect", socketid);  // Emit only if the player is in an active match
                 break;  // Exit the loop once the match is found
             }
         }
     }
 
     TotalPlayers--;
     io.emit("updatedPlayerCount", TotalPlayers);
 }
 
function handlePlayRequest(socketid) {
    player = player.filter(item => item.socketid !== socketid);
    waitingPlayer.push(socketid);
  

    if (waitingPlayer.length >= 2 ) {

       
        createMatch();
    }
    
}
io.on("connection",(socket) =>{
     playerJoin(socket.id);
    socket.on('disconnect',(socketid) => {
   
     playerDisconnect(socket.id);
        
    })

    socket.on('PlayRequest',(socketid)=>{
        handlePlayRequest(socketid);
    })
    socket.on("ChoiceMade",({playerid,choice}) => {
       io.emit('ChoiceMade',{playerid,choice})
    })    
})

const port = process.env.PORT || 3000;

httpServer.listen(port,() =>{
    console.log(`Server runnning on port ${port}`);
    
})
