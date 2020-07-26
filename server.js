const net = require("net");
const fs = require("fs");
const chatLog = fs.createWriteStream("./logs/chat-log.txt");
const serverLog = fs.createWriteStream("./logs/server-log.txt");

let takenNames = [];
let connectedUsers = [];
let currentClient;
let otherUsers = [];
let userCounter = 0;

class Client {
  constructor(name, id, socket) {
    this.name = name;
    this.id = id;
    this.socket = socket;
  }
}

function idGenerator() {
  let result = Math.floor(Math.random() * 100000);
  return result;
}
function changeName(newName) {
  checkForDuplicateNames(newName);
  sendMessage(`${currentClient.name} has changed their name to ${newName}`);
  console.log(`--- ${currentClient.name} Changed their name to ${name}`);
  takenNames.push(newName);
}

function checkForDuplicateNames(name) {
  takenNames.filter((element) => {
    if (element.includes(name) && element.length === name.length) {
      name += "(1)";
    }
  });
  return name;
}
function getOtherUsers(client) {
   
  connectedUsers.filter((user) => {
    if (user.name !== currentClient.name)
      otherUsers.push(user);
  });
  return otherUsers;
}

function whisperUser(user, message) {
  if (checkConnectedUsers(user))
    username.socket.write(`(*)${currentClient.name}: ${message}`);
}
console.clear();
//Server Starts Here
const server = net
  .createServer((socket) => {
    userCounter++;
    currentClient = new Client('', idGenerator(), socket);
    connectedUsers.push(currentClient);
    getOtherUsers(currentClient);
      console.log(`User ${currentClient.name} connected`); 
      serverLog.write(`User ${currentClient.name} connected ${new Date().toISOString()}\n`)
    socket.on("data", (data) => {
      checkForCommand(data.toString().trim());
    });
    socket.on("end", () => {
      connectedUsers.filter((user, index) => {
        if (user.name === currentClient.name) {
          console.log(`${user.name} disconnected`);
          serverLog.write(
            `${user.name} Disconnected: ${new Date().toISOString()}`
          );
          connectedUsers.splice(index, 1);
        }
      });
    });

    //functions
    function checkConnectedUsers(username) {
      return connectedUsers.filter((user) => {
        if (user.name === username) return true;
      });
    }

    function runCommand(command, nameToCheck, input) {
      let client;
      if (checkCOnnectedUsers(nameToCheck)) {
        client = connectedUsers.filter((user) => user.name == nameToCheck);
      } else {
      }
      let response = client.socket.write();
      console.log(
        `---COMMAND: ${command} username: ${client.name} INPUT ${input}`
      );
      if (command.match(/^\/w$/)) {
        whisperUser(client.name, input);
      } else if (command.match(/^\/username/)) {
        if (
          username.length <= 10 &&
          username.match(/^[A-Za-z0-9]+[A-Za-z0-9]*$/g)
        ) {
          changeName(client);
          response(`your username is now changed to ${username}`);
        } else {
          response(
            `"${username}" is an invalid username, Please use only alphanumeric characters`
          );
        }
      } else if (command.match(/^\/kick/)) {
        if (checkConnectedUsers(username) && input === superSecretPassword) {
          sendMessage(`${username} has been removed from the server`);
        } else {
          response(`${username} doesn't exist`);
        }
      } else if (command.match(/^\/clientlist/)) {
        let usernames = connectedUsers.map((user) => {
          usernames.push(user.name);
        });
        response(`Currently connected users:\r\n${usernames.join("\n")}`);
      } else if (command.match(/^\/[\?]$/)) {
        let help = [
          "Available commands:",
          "/w:Sends a private message to a user in the server.",
          "Syntax: /w <username> <message>",
          "/username: Change your username.",
          "Syntax: /username <newusername>",
          " /kick: Removes a user from the server if admin password is used.",
          "Syntax: /kick <username> <password>",
          "/clientlist: shows a list of all currently connected users. Syntax: /clientlist",
        ];
        help.map((line) => {
          socket.write(line);
        });
      }
      return response;
    }

    function cleanInput(input) {
      let seperatedInput = input.split(" ");
      return runCommand(
        seperatedInput[0],
        seperatedInput[1],
        seperatedInput.slice(2).join(" ")
      );
    }
    function sendMessage(message) {
      otherUsers.forEach((user) => {
        user.socket.write(`${currentClient.name}: ${message}`);
      });
    }

    function checkForCommand(input) {
      if (input.match(/^\//)) {
        return cleanInput(input);
      } else {
        sendMessage(input);
        chatLog.write(`${input} ${new Date().toISOString()}\n`);
      }
    }
  })
  .listen(3050, () => {
    serverLog.write(`Server started: ${new Date().toISOString()}\n`);
    console.log("---server is up");
  });

server.on("close", () => {
  serverLog.write(`Server started: ${new Date().toISOString()}\n`);
});
