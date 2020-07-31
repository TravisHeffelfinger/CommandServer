const net = require("net");
const fs = require("fs");
const chatLog = fs.createWriteStream("./logs/chat-log.txt");
const serverLog = fs.createWriteStream("./logs/server-log.txt");
const { v4: uuidv4 } = require("uuid");
const port = process.env.PROT || 3051;

console.clear();

let takenNames = [];
let connectedUsers = [];
let superSecretPassword = "password";

class Client {
  constructor(name, socket) {
    this.name = name;
    this.id = uuidv4();
    this.socket = socket;
    this.adminAttempts = 0;
    this.admin = false;
  }
}
//Server Starts Here
const server = net
  .createServer((socket) => {
    connectedUsers.push(
      new Client(`Guest${Math.floor(Math.random() * 1000)}`, socket)
    );
    let currentClient = checkConnectedUsers(socket);
    if (connectedUsers.length === 1) currentClient.admin = true;
    takenNames.push(currentClient.name);
    console.log(`User ${currentClient.name} connected`);
    currentClient.socket.write(
      `${colorSelector("green")}Welcome to the server ${currentClient.name}!`
    );
    sendBroadcast(
      `User ${currentClient.name} has joined the server!`,
      currentClient,
      "green"
    );
    serverLog.write(
      `User ${currentClient.name} connected ${new Date().toISOString()}\n`
    );
    
    socket.on("data", (data) => {
      checkForCommand(data.toString().trim());
    });

    socket.on("end", () => {
      let currentUser = checkConnectedUsers(socket);
      connectedUsers.filter((user, index) => {
        if (user.name === currentUser.name) {
          console.log(`${user.name} disconnected`);
          serverLog.write(
            `${user.name} Disconnected: ${new Date().toISOString()}`
          );
          sendBroadcast(
            `User ${user.name} disconnected`,
            currentUser,
            "yellow"
          );
          takenNames.splice(takenNames.indexOf(user.name), 1);
          connectedUsers.splice(index, 1);
        }
      });
    });

    //functions
    function checkConnectedUsers(property) {
      let result;
      connectedUsers.filter((user) => {
        if (
          user.name == property ||
          user.id == property ||
          user.socket == property
        ) {
          result = user;
        }
      });
      return result;
    }

    function runCommand(command, nameToCheck, input, sendingUser) {
      let client = checkConnectedUsers(nameToCheck);
      if (command.match(/^\/[\?]$/)) {
        let help = [
          `Available commands:`,
          "/w: Sends a private message to a user in the server.",
          "-Syntax: /w <username> <message>",
          "/username: Change your username.",
          "-Syntax: /username <newusername>",
          "/kick: Removes a user from the server if admin password is used.",
          "-Syntax: /kick <username> <password>",
          "/clientlist: shows a list of all currently connected users.",
          "Names with the * symbol are admin",
          "-Syntax: /clientlist",
        ];
        help.forEach((line) => {
          sendingUser.socket.write(`${colorSelector("yellow")}${line}\n`);
        });
      } else if (command.match(/^\/username/)) {
        if (nameToCheck) {
          if (
            nameToCheck.length <= 10 &&
            nameToCheck.match(/^[A-Za-z0-9]+[A-Za-z0-9]*$/g)
          ) {
            changeName(nameToCheck, sendingUser);
          } else {
            sendingUser.socket.write(
              `${colorSelector(
                "red"
              )}"${nameToCheck}" is an invalid username, Please use only alphanumeric characters`
            );
          }
        } else {
          sendingUser.socket.write(
            `${colorSelector("red")}Please enter a desired username`
          );
        }
      } else if (command.match(/^\/w$/)) {
        if (client) {
          if (nameToCheck && input) {
            client.socket.write(
              `${colorSelector("cyan")}${sendingUser.name} whispered: ${input}`
            );
          } else if (nameToCheck) {
            sendingUser.socket.write(
              `${colorSelector(
                "red"
              )}No message entered, try /? for more information`
            );
          } else {
            sendingUser.socket.write(
              `${colorSelector(
                "red"
              )}No username entered. try /? for more information`
            );
          }
        }
      } else if (command.match(/^\/kick/)) {
        if (client && sendingUser.admin) {
          if (sendingUser.adminAttempts > 3) {
            sendingUser.socket.write(
              `${colorSelector("red")}Too many failed attempts. try again later`
            );
            setTimeout(() => {
              if (socket) {
                let user = checkConnectedUsers(socket);
                user.adminAttempts = 0;
              }
            }, 60000);
          } else {
            if (
              input === superSecretPassword &&
              client.name != sendingUser.name
            ) {
              connectedUsers.filter((user, index) => {
                if (user.name === client.name) {
                  console.log(`${user.name} has been removed from the server`);
                  serverLog.write(
                    `${
                      user.name
                    } has been removed from the server: ${new Date().toISOString()}`
                  );
                  user.socket.write(
                    `${colorSelector(
                      "magenta"
                    )}You have been removed from the server`
                  );
                  sendBroadcast(
                    `${user.name} has been removed from the server`,
                    sendingUser,
                    "magenta"
                  );
                  user.socket.end();
                }
              });
            } else if (input !== superSecretPassword) {
              sendingUser.socket.write(
                `${colorSelector(
                  "red"
                )}Incorrect admin password, please try again`
              );
              sendingUser.adminAttempts++;
            } else if (client.name === sendingUser.name) {
              sendingUser.socket.write(
                `${colorSelector(
                  "red"
                )}You cannot remove yourself. To end the session press CONTROL + C`
              );
            }
          }
        } else {
          sendingUser.socket.write(
            `${colorSelector(
              "red"
            )}Admin privleges required to use this command.`
          );
        }
      } else if (command.match(/^\/addAdmin/)) {
        if (client && input === superSecretPassword) {
          client.admin = true;
          client.name == sendingUser.name
            ? sendingUser.socket.write(
                `${colorSelector("magenta")}You are now admin`
              )
            : client.socket.write(
                `${colorSelector("magenta")}You are now an admin`
              ),
            sendingUser.socket.write(
              `${colorSelector("magenta")}You have granted ${
                client.name
              }  admin privileges`
            );
        } else if (client && input !== superSecretPassword) {
          sendingUser.adminAttempts++;
          sendingUser.socket.write(
            `${colorSelector("red")}Incorrect admin password, please try again`
          );
        } else {
          sendingUser.socket.write(
            `${colorSelector("red")}Please enter a valid name`
          );
        }
      } else if (command.match(/^\/clientlist/)) {
        let usernames = [];
        connectedUsers.forEach((user) => {
          user.admin && user.name == sendingUser.name
            ? usernames.push(`*(${user.name})*`)
            : user.name === sendingUser.name
            ? usernames.push(`(${user.name})`)
            : user.admin
            ? usernames.push(`*${user.name}*`)
            : usernames.push(user.name);
        });
        sendingUser.socket.write(
          `${colorSelector(
            "yellow"
          )}Currently connected users:\r\n${usernames.join("\n")}`
        );
      } else {
        sendingUser.socket.write(
          `${colorSelector(
            "red"
          )}${command} is not a valid command. type /? for a list of commands`
        );
      }
    }

    function cleanInput(input, user) {
      let seperatedInput = input.split(" ");
      return runCommand(
        seperatedInput[0],
        seperatedInput[1],
        seperatedInput.slice(2).join(" "),
        user
      );
    }

    function sendBroadcast(message, sendingUser, color) {
      connectedUsers.forEach((user) => {
        if (user.name !== sendingUser.name) {
          user.socket.write(`${colorSelector(color)}${message}`);
          serverLog.write(`${message}  | ${new Date().toISOString()}\n`);
        }
      });
    }

    function sendMessage(message, sendingUser) {
      connectedUsers.forEach((user) => {
        if (user.id !== sendingUser.id && sendingUser.admin) {
          user.socket.write(
            `${colorSelector("magenta")}${sendingUser.name}: ${colorSelector(
              "blue"
            )}${message}`
          );
          chatLog.write(
            `${currentClient.name}: ${message} | ${new Date().toISOString()}\n`
          );
        } else if (user.id !== sendingUser.id) {
          user.socket.write(
            `${colorSelector("blue")}${sendingUser.name}: ${message}`
          );
          chatLog.write(
            `${currentClient.name}: ${message} | ${new Date().toISOString()}\n`
          );
        }
      });
    }

    function checkForCommand(input) {
      let sendingUser = checkConnectedUsers(socket);
      if (input.match(/^\//)) {
        return cleanInput(input, sendingUser);
      } else {
        sendMessage(input, sendingUser);
      }
    }

    function changeName(desiredName, currentUser) {
      if (takenNames.includes(desiredName)) {
        currentUser.socket.write(
          `${colorSelector(
            "red"
          )}the username "${desiredName}" is already taken please try a different one`
        );
      } else {
        sendBroadcast(`name changed to ${desiredName}`, currentUser, "green");
        currentUser.socket.write(
          `${colorSelector(
            "green"
          )}your username is now changed to ${desiredName}`
        );
        console.log(`${currentUser.name} Changed their name to ${desiredName}`);
        currentUser.name = desiredName;
        takenNames.push(desiredName);
      }
    }

    function colorSelector(color) {
      let result = "";
      switch (color) {
        case "blue":
          result = "\\x1b[34m";
          break;
        case "red":
          result = "\\x1b[31m";
          break;
        case "green":
          result = "\\x1b[32m";
          break;
        case "yellow":
          result = "\\x1b[33m";
          break;
        case "magenta":
          result = "\\x1b[35m";
          break;
        case "cyan":
          result = "\\x1b[36m";
          break;
        default:
          result = "\\x1b[37m";
      }
      return result;
    }
  })
  .listen(port, () => {
    serverLog.write(`Server started: ${new Date().toISOString()}\n`);
    console.log(`Server is listening on ${port}`);
  });

server.on("close", () => {
  serverLog.write(`Server ended: ${new Date().toISOString()}\n`);
});
