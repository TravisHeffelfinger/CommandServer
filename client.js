const net = require("net");

const FgBlue = "\x1b[34m";
const FgRed = "\x1b[31m";
const FgGreen = "\x1b[32m";
const FgYellow = "\x1b[33m";
const FgMagenta = "\x1b[35m";
const FgWhite = "\x1b[37m";
const FgCyan = "\x1b[36m";

function readColors(message) {
  message = message.toString();
  if (message.includes("\\x1b[34m") && message.includes("\\x1b[35m")) {
    let removeMagenta = message.split("\\x1b[35m");
    let removeBlue = removeMagenta[1].split("\\x1b[34m");
    let name = removeBlue[0];
    let content = removeBlue[1];
    console.log(FgMagenta, name.trim(), FgBlue, content, FgWhite);
  } else if (message.includes("\\x1b[34m")) {
    let printToConsole = message.slice(8);
    console.log(FgBlue, printToConsole.toString(), FgWhite);
  } else if (message.includes("\\x1b[31m")) {
    let printToConsole = message.slice(8);
    console.log(FgRed, printToConsole.toString(), FgWhite);
  } else if (message.includes("\\x1b[32m")) {
    let printToConsole = message.slice(8);
    console.log(FgGreen, printToConsole.toString(), FgWhite);
  } else if (message.includes("\\x1b[33m")) {
    let printToConsole = message.slice(8);
    console.log(FgYellow, printToConsole.toString(), FgWhite);
  } else if (message.includes("\\x1b[35m")) {
    let printToConsole = message.slice(8);
    console.log(FgMagenta, printToConsole.toString(), FgWhite);
  } else if (message.includes("\\x1b[36m")) {
    let printToConsole = message.slice(8);
    console.log(FgCyan, printToConsole.toString(), FgWhite);
  } else {
    console.log(message.toString());
  }
}

const client = net.createConnection({ port: 3051 }, () => {
  console.clear();
});

client.on("connect", () => {
  console.log("Connected to server");
});

client.on("data", (response) => {
  readColors(response);
});

client.on("end", () => {
  console.log("Server has been ended. Good bye!");
  process.exit();
});

process.stdin.on("readable", () => {
  let userInput;
  while ((userInput = process.stdin.read()) !== null) {
    client.write(userInput.toString().trim());
  }
});
