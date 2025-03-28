const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Инициализация бота
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: false });

// Создание клавиатуры с кнопками
const mainKeyboard = {
    reply_markup: {
        keyboard: [
            [{ text: '🏋️ Моя тренировка' }, { text: '🌐 Перейти на сайт' }]
        ],
        resize_keyboard: true
    }
};

// Обработка команды /start
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId,
        'Привет! Я бот для отслеживания тренировок. Чем могу помочь?',
        mainKeyboard
    );
});

// Обработка текстовых сообщений
bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    // Игнорируем команды
    if (text.startsWith('/')) return;

    switch (text) {
        case '🏋️ Моя тренировка':
            // Здесь будет логика получения ближайшей тренировки
            bot.sendMessage(chatId,
                'Ваша ближайшая тренировка:\n\n' +
                '📅 Дата: 20 марта 2024\n' +
                '⏰ Время: 18:00\n' +
                '💪 Тип: Силовая тренировка\n\n' +
                'Упражнения:\n' +
                '1. Жим штанги лежа: 3x12\n' +
                '2. Приседания: 4x15\n' +
                '3. Тяга верхнего блока: 3x12',
                mainKeyboard
            );
            break;

        case '🌐 Перейти на сайт':
            const inlineKeyboard = {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: 'Открыть сайт', url: 'https://bagatracker.ru' }]
                    ]
                }
            };
            bot.sendMessage(chatId, 'Переходите на наш сайт:', inlineKeyboard);
            break;

        default:
            // Если получено любое другое сообщение, показываем приветствие и кнопки
            bot.sendMessage(chatId,
                'Привет! Я бот для отслеживания тренировок. Чем могу помочь?',
                mainKeyboard
            );
    }
});

// Обработка callback_query (нажатия на inline-кнопки)
bot.on('callback_query', (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const data = callbackQuery.data;

    // Отвечаем на callback query
    bot.answerCallbackQuery(callbackQuery.id);

    // Обрабатываем нажатие на кнопку
    switch (data) {
        case 'open_website':
            bot.sendMessage(chatId, 'Переходите на наш сайт: https://bagatracker.ru');
            break;
    }
});

// Обработка команды /help
bot.onText(/\/help/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId,
        'Доступные команды:\n' +
        '/start - Начать работу с ботом\n' +
        '/help - Показать это сообщение\n' +
        '/website - Открыть веб-приложение',
        mainKeyboard
    );
});

// Обработка команды /website
bot.onText(/\/website/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId,
        'Вот ссылка на веб-приложение: https://bagatracker-bot.onrender.com',
        mainKeyboard
    );
});

// Настройка webhook
const webhookUrl = `https://bagatracker-bot.onrender.com/webhook`;
bot.setWebHook(webhookUrl).then(() => {
    console.log('Webhook установлен');
}).catch((error) => {
    console.error('Ошибка установки webhook:', error);
});

// Обработка webhook
app.post('/webhook', (req, res) => {
    bot.handleUpdate(req.body);
    res.sendStatus(200);
});

// Базовый маршрут для проверки работоспособности
app.get('/', (req, res) => {
    res.send('Бот работает!');
});

// Запуск сервера
app.listen(port, () => {
    console.log(`Сервер запущен на порту ${port}`);
});