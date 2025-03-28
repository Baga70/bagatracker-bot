const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Инициализация бота
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

// Обработка команды /start
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Привет! Я бот для отслеживания тренировок. Чем могу помочь?');
});

// Обработка команды /help
bot.onText(/\/help/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Доступные команды:\n/start - Начать работу с ботом\n/help - Показать это сообщение\n/website - Открыть веб-приложение');
});

// Обработка команды /website
bot.onText(/\/website/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Вот ссылка на веб-приложение: https://bagatracker-bot.onrender.com');
});

// Обработка ошибок
bot.on('polling_error', (error) => {
    console.log(error);
});

// Базовый маршрут для проверки работоспособности
app.get('/', (req, res) => {
    res.send('Бот работает!');
});

// Запуск сервера
app.listen(port, () => {
    console.log(`Сервер запущен на порту ${port}`);
});