const net = require("net");
const fs = require("fs");

let check = true;  

const client = net.createConnection({ port: 3050 }, () => {
  console.clear();
});

client.on("connect", () => {
  console.log("Connected to server");
});

client.on("data", (response) => {
  console.log(`#${response}`);
});

client.on("end", () => {
  process.exit();
});

process.stdin.on("readable", () => {
  let userInput;
  while ((userInput = process.stdin.read()) !== null && check) {
    client.write(userInput.toString().trim());
  }
});
