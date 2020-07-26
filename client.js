const net = require("net");
const fs = require("fs");

let check = true;

function runCommand(input) {
  if (input.match(/^\/w$/)) {
    client.write(input);
  } else if (input.match(/^\/username/)) {
    client.write(input);
  } else if (input.match(/^\/kick/)) {
    client.write(input);
  } else if (input.match(/^\/clientlist$/)) {
    client.write(input);
  } else {
    client.write(input);
  }
}

function processInput(input) {
  //client side check only
  if (input.match(/^\//)) {
    runCommand(input);
  } else if (input.match(/^clear$/)) {
    console.clear();
  } else {
    client.write(input);
  }
}

const client = net.createConnection({ port: 3050 }, () => {
  console.clear();
});

client.on("connect", () => {
  console.log("__connected to server");
});

client.on("data", (response) => {
  console.log(`#${response}`);
});

client.on("end", () => {
  console.log("__server is ded bois");
  process.exit();
});

process.stdin.on("readable", () => {
  let userInput;
  while ((userInput = process.stdin.read()) !== null && check) {
    processInput(userInput.toString().trim());
  }
});
