
//Object that hold the Current Players and role
let currengame = {};

class GameSession {
  constructor( mode , whiteID , blackID) {
    this.mode = mode;
    this.white = whiteID;
    this.black = blackID;
    this.waiting = true;
  }
}

class boardsetupData {
    constructor( code, mode , playerColor) {
     this.code = code; 
     this.mode = mode;
     this.color = playerColor;
  }
}

module.exports = {currengame,GameSession,boardsetupData};