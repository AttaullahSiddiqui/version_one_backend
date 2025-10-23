import { config } from 'dotenv';

config({
  path: `.env.${process.env.ENV || 'development'}.local`,
});

export const { PORT, ENV, TOKEN_SECRET, SERVER_URL, CLIENT_URL, DATABASE_URL } =
  process.env;
