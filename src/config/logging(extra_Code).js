// ALL CODE IS GOOD AND TESTED

// import fs from 'fs';
// import path from 'path';
// import chalk from 'chalk';

// const logDir = path.resolve('logs');
// if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);

// const logFile = path.join(logDir, 'server.log');

// const colours = {
//   reset: '\x1b[0m',
//   fg: {
//     black: '\x1b[30m',
//     red: '\x1b[31m',
//     green: '\x1b[32m',
//     yellow: '\x1b[33m',
//     blue: '\x1b[34m',
//     magenta: '\x1b[35m',
//     cyan: '\x1b[36m',
//     white: '\x1b[37m',
//   },
//   bg: { green: '\x1b[42m' },
// };

// function writeToFile(level, message, caller = '--') {
//   const logMessage = `[${new Date().toISOString()}] [${level}] [${caller}] ${message}\n`;
//   fs.appendFileSync(logFile, logMessage, 'utf8');
// }

// export function getCallingFunction(error) {
//   try {
//     const stack = error.stack;
//     if (!stack) return '--';
//     const line = stack.split('\n')[2];
//     const regex = /^.*at\s([a-zA-Z]+).*$/;
//     const groups = line.match(regex);
//     return groups && groups[1] ? groups[1] : '--';
//   } catch {
//     return '--';
//   }
// }

// export function log(message, ...optionalParams) {
//   console.log(
//     `[${new Date().toLocaleString()}]`,
//     colours.fg.magenta,
//     '[SERVER-LOG]',
//     colours.reset,
//     message,
//     ...optionalParams
//   );
//   writeToFile('LOG', message);
// }

// export function info(message, ...optionalParams) {
//   const caller = getCallingFunction(new Error());
//   console.info(
//     `[${new Date().toLocaleString()}]`,
//     colours.fg.cyan,
//     '[INFO]',
//     colours.reset,
//     colours.bg.green,
//     `[${caller}]`,
//     colours.reset,
//     message,
//     ...optionalParams
//   );
//   writeToFile('INFO', message, caller);
// }

// export function warn(message, ...optionalParams) {
//   const caller = getCallingFunction(new Error());
//   console.warn(
//     `[${new Date().toLocaleString()}]`,
//     colours.fg.yellow,
//     '[WARN]',
//     colours.reset,
//     colours.bg.green,
//     `[${caller}]`,
//     colours.reset,
//     message,
//     ...optionalParams
//   );
//   writeToFile('WARN', message, caller);
// }

// export function error(message, ...optionalParams) {
//   const caller = getCallingFunction(new Error());
//   console.error(
//     `[${new Date().toLocaleString()}]`,
//     colours.fg.red,
//     '[ERROR]',
//     colours.reset,
//     colours.bg.green,
//     `[${caller}]`,
//     colours.reset,
//     message,
//     ...optionalParams
//   );
//   writeToFile('ERROR', message, caller);
// }

// const logging = { log, info, warn, error, getCallingFunction };
// globalThis.logging = logging;
// export default logging;
