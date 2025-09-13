
// Responsible for making code for each user

let codes = [];
function generateNum() {
  let num;

  do {
    num = Math.floor(1000 + Math.random() * 9000);
  } while (codes.includes(num));

  codes.push(num);

  return num;
}

function playerColor(){

  let colors = ['white','black'];
  let num = Math.floor(Math.random()*2);
  return colors[num];

}


module.exports = {generateNum,playerColor,codes};
