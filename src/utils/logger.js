import util from 'util';
import 'winston-mongodb';
import { createLogger, format, transports } from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import * as sourceMapSupport from 'source-map-support';
import { red, blue, yellow, green, magenta } from 'colorette';
import { ENV, DATABASE_URL } from '#config/index.js';
import { EApplicationEnvironment } from '#constants/application.js';

// Enable source map support for stack traces
sourceMapSupport.install();

const colorizeLevel = level => {
  switch (level) {
    case 'ERROR':
      return red(level);
    case 'INFO':
      return blue(level);
    case 'WARN':
      return yellow(level);
    default:
      return level;
  }
};

const consoleLogFormat = format.printf(info => {
  const { level, message, timestamp, meta = {} } = info;
  const customLevel = colorizeLevel(level.toUpperCase());
  const customTimestamp = green(timestamp);
  const customMessage = message;

  const customMeta = util.inspect(meta, {
    showHidden: false,
    depth: null,
    colors: true,
  });

  return `${customLevel} [${customTimestamp}] ${customMessage}\n${magenta('META')} ${customMeta}\n`;
});

const fileLogFormat = format.printf(info => {
  const { level, message, timestamp, meta = {} } = info;
  const logMeta = {};

  for (const [key, value] of Object.entries(meta)) {
    if (value instanceof Error) {
      logMeta[key] = {
        name: value.name,
        message: value.message,
        trace: value.stack || '',
      };
    } else {
      logMeta[key] = value;
    }
  }

  const logData = {
    level: level.toUpperCase(),
    message,
    timestamp,
    meta: logMeta,
  };

  return JSON.stringify(logData, null, 4);
});

const consoleTransport = () => {
  return ENV === EApplicationEnvironment.DEVELOPMENT
    ? [
        new transports.Console({
          level: 'info',
          format: format.combine(format.timestamp(), consoleLogFormat),
        }),
      ]
    : [];
};

const FileTransport = () => {
  return [
    new transports.File({
      filename: path.join(__dirname, '../', '../', 'logs', `${ENV}.log`),
      level: 'info',
      format: format.combine(format.timestamp(), fileLogFormat),
    }),
  ];
};

const MongodbTransport = () => {
  return [
    new transports.MongoDB({
      level: 'info',
      db: DATABASE_URL,
      metaKey: 'meta',
      expireAfterSeconds: 3600 * 24 * 30,
      collection: 'application-logs',
    }),
  ];
};

export default createLogger({
  defaultMeta: {
    meta: {},
  },
  transports: [
    ...consoleTransport(),
    ...FileTransport(),
    ...MongodbTransport(),
  ],
});
