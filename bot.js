const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const app = express();
const port = process.env.PORT || 3000;

// Инициализация бота
const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

// Обработка команд
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Привет! Я бот для отслеживания тренировок. Используйте /help для просмотра доступных команд.');
});

bot.onText(/\/help/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId,
        'Доступные команды:\n' +
        '/start - Начать работу с ботом\n' +
        '/help - Показать это сообщение\n' +
        '/website - Получить ссылку на сайт'
    );
});

bot.onText(/\/website/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Вот ссылка на сайт: https://bagatracker.onrender.com');
});

// Обработка ошибок
bot.on('polling_error', (error) => {
    console.log(error);
});

// Настройка Express
app.get('/', (req, res) => {
    res.send('Бот работает!');
});

// Запуск сервера
app.listen(port, () => {
    console.log(`Сервер запущен на порту ${port}`);
});