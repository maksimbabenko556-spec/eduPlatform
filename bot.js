import 'dotenv/config';
import { Bot } from '@maxhub/max-bot-api';

const bot = new Bot(process.env.BOT_TOKEN);

const SYSTEM_PROMPT =
  'Ты — дружелюбный помощник. Отвечай на русском, кратко и по делу.';

// Память диалога: userId -> массив сообщений
const memory = new Map();