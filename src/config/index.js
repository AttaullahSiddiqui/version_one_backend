import DotenvFlow from 'dotenv-flow';

DotenvFlow.config();

export default {
  PORT: process.env.PORT || 3000,
  ENV: process.env.ENV,
  TOKEN_SECRET: process.env.TOKEN_SECRET,
  SERVER_URL: process.env.SERVER_URL,
  CLIENT_URL: process.env.CLIENT_URL,
  DATABASE_URL: process.env.DATABASE_URL,
};
