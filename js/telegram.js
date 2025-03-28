// Класс для работы с Telegram
class TelegramNotifier {
    constructor() {
        this.settings = this.loadSettings();
        this.botToken = '7778567481:AAH2wnLspwL83nFV3MfyKCQifVjBiQzmi0E';
        this.setupBot();
    }

    // Загрузка настроек
    loadSettings() {
        return {
            botToken: localStorage.getItem('telegram-bot-token') || '',
            chatId: localStorage.getItem('telegram-chat-id') || '',
            enabled: localStorage.getItem('telegram-notifications-enabled') === 'true'
        };
    }

    // Сохранение настроек
    saveSettings(settings) {
        localStorage.setItem('telegram-bot-token', settings.botToken);
        localStorage.setItem('telegram-chat-id', settings.chatId);
        localStorage.setItem('telegram-notifications-enabled', settings.enabled);
        this.settings = settings;
    }

    // Настройка бота
    async setupBot() {
        try {
            // Устанавливаем команды бота
            await this.setCommands([
                { command: 'start', description: 'Начать работу с ботом' },
                { command: 'workout', description: 'Показать ближайшую тренировку' },
                { command: 'website', description: 'Перейти на сайт' }
            ]);

            // Запускаем длинный поллинг для получения обновлений
            this.startPolling();
        } catch (error) {
            console.error('Ошибка настройки бота:', error);
        }
    }

    // Установка команд бота
    async setCommands(commands) {
        try {
            const response = await fetch(`https://api.telegram.org/bot${this.botToken}/setMyCommands`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ commands })
            });
            const data = await response.json();
            if (!data.ok) {
                throw new Error(data.description);
            }
        } catch (error) {
            console.error('Ошибка установки команд:', error);
        }
    }

    // Отправка сообщения с клавиатурой
    async sendMessageWithKeyboard(chatId, text, keyboard) {
        try {
            const response = await fetch(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: text,
                    parse_mode: 'HTML',
                    reply_markup: keyboard
                })
            });

            const data = await response.json();
            if (!data.ok) {
                throw new Error(data.description);
            }
            return data;
        } catch (error) {
            console.error('Ошибка отправки сообщения:', error);
            throw error;
        }
    }

    // Получение обновлений от бота
    async getUpdates(offset = 0) {
        try {
            const response = await fetch(`https://api.telegram.org/bot${this.botToken}/getUpdates?offset=${offset}&timeout=30`);
            const data = await response.json();
            return data.ok ? data.result : [];
        } catch (error) {
            console.error('Ошибка получения обновлений:', error);
            return [];
        }
    }

    // Запуск длинного поллинга
    async startPolling() {
        let offset = 0;
        while (true) {
            try {
                const updates = await this.getUpdates(offset);
                for (const update of updates) {
                    if (update.message) {
                        await this.handleMessage(update.message);
                    }
                    offset = update.update_id + 1;
                }
            } catch (error) {
                console.error('Ошибка в процессе поллинга:', error);
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }
    }

    // Обработка входящих сообщений
    async handleMessage(message) {
        const chatId = message.chat.id;
        const text = message.text;

        if (text === '/start') {
            const keyboard = {
                keyboard: [
                    [{ text: '🏋️‍♂️ Моя тренировка' }],
                    [{ text: '🌐 Перейти на сайт' }]
                ],
                resize_keyboard: true
            };
            await this.sendMessageWithKeyboard(chatId, 'Добро пожаловать! Выберите действие:', keyboard);
        } else if (text === '/workout' || text === '🏋️‍♂️ Моя тренировка') {
            const workout = await this.getNextWorkout();
            if (workout) {
                await this.sendWorkoutReminder(workout);
            } else {
                await this.sendMessage('У вас нет запланированных тренировок');
            }
        } else if (text === '/website' || text === '🌐 Перейти на сайт') {
            await this.sendMessage('Перейдите на наш сайт: https://bagatracker.ru');
        }
    }

    // Получение следующей тренировки
    getNextWorkout() {
        const workouts = JSON.parse(localStorage.getItem('workouts') || '[]');
        const now = new Date();
        const activeWorkouts = workouts.filter(w => {
            if (w.completed || w.deleted) return false;
            const workoutDateTime = new Date(w.date + 'T' + (w.time || '00:00'));
            return workoutDateTime > now;
        }).sort((a, b) => {
            const dateA = new Date(a.date + 'T' + (a.time || '00:00'));
            const dateB = new Date(b.date + 'T' + (b.time || '00:00'));
            return dateA - dateB;
        });
        return activeWorkouts[0] || null;
    }

    // Отправка сообщения
    async sendMessage(text) {
        try {
            const response = await fetch(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chat_id: this.settings.chatId,
                    text: text,
                    parse_mode: 'HTML'
                })
            });

            const data = await response.json();
            if (!data.ok) {
                throw new Error(data.description);
            }
            return data;
        } catch (error) {
            console.error('Ошибка отправки сообщения в Telegram:', error);
            throw error;
        }
    }

    // Форматирование тренировки для отправки
    formatWorkoutMessage(workout) {
            let message = `<b>🏋️‍♂️ Тренировка: ${workout.name}</b>\n\n`;
            message += `<b>Тип:</b> ${workout.type}\n`;
            message += `<b>Дата:</b> ${formatDate(workout.date)}\n`;
            message += `<b>Время:</b> ${workout.time}\n\n`;

            if (workout.exercises && workout.exercises.length > 0) {
                message += '<b>Упражнения:</b>\n';
                workout.exercises.forEach((exercise, index) => {
                            message += `${index + 1}. ${exercise.name}\n`;
                            if (exercise.type === 'reps') {
                                message += `   ${exercise.sets} × ${exercise.reps} ${exercise.weight ? `• ${exercise.weight}кг` : ''}\n`;
                } else {
                    message += `   ${exercise.duration} мин\n`;
                }
            });
        }

        if (workout.notes) {
            message += `\n<b>Заметки:</b>\n${workout.notes}`;
        }

        return message;
    }

    // Отправка уведомления о предстоящей тренировке
    async sendWorkoutReminder(workout) {
        const message = this.formatWorkoutMessage(workout);
        return this.sendMessage(message);
    }
}

// Создаем глобальный экземпляр
window.telegramNotifier = new TelegramNotifier();

// Обработчик формы настроек Telegram
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('telegram-settings-form');
    if (!form) return;

    // Загружаем сохраненные настройки
    const settings = window.telegramNotifier.loadSettings();
    document.getElementById('telegram-bot-token').value = settings.botToken;
    document.getElementById('telegram-chat-id').value = settings.chatId;
    document.getElementById('telegram-notifications-enabled').checked = settings.enabled;

    // Обработчик сохранения настроек
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const newSettings = {
            botToken: document.getElementById('telegram-bot-token').value.trim(),
            chatId: document.getElementById('telegram-chat-id').value.trim(),
            enabled: document.getElementById('telegram-notifications-enabled').checked
        };

        try {
            // Пробуем отправить тестовое сообщение
            if (newSettings.enabled && newSettings.botToken && newSettings.chatId) {
                await window.telegramNotifier.sendMessage('✅ Настройки Telegram успешно сохранены!');
            }
            
            // Сохраняем настройки
            window.telegramNotifier.saveSettings(newSettings);
            showNotification('Настройки Telegram сохранены', 'success');
        } catch (error) {
            showNotification('Ошибка сохранения настроек Telegram: ' + error.message, 'error');
        }
    });
});