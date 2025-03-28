// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    setupEventListeners();
});

// Загрузка настроек
function loadSettings() {
    const settings = JSON.parse(localStorage.getItem('settings') || '{}');

    // Загрузка настроек уведомлений
    const notificationsEnabled = document.getElementById('notifications-enabled');
    if (notificationsEnabled) {
        notificationsEnabled.checked = settings.notificationsEnabled !== false;
    }

    const notificationSound = document.getElementById('notification-sound');
    if (notificationSound) {
        notificationSound.checked = settings.notificationSound !== false;
    }
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Обработчик формы настроек
    const settingsForm = document.getElementById('settings-form');
    if (settingsForm) {
        settingsForm.addEventListener('submit', handleSettingsSubmit);
    }

    // Обработчик очистки данных
    const clearDataBtn = document.getElementById('clear-data');
    if (clearDataBtn) {
        clearDataBtn.addEventListener('click', handleClearData);
    }
}

// Обработка отправки формы настроек
function handleSettingsSubmit(event) {
    event.preventDefault();

    const settings = {
        notificationsEnabled: document.getElementById('notifications-enabled').checked,
        notificationSound: document.getElementById('notification-sound').checked
    };

    localStorage.setItem('settings', JSON.stringify(settings));
    showNotification('Настройки сохранены', 'success');
}

// Обработка очистки данных
function handleClearData() {
    if (confirm('Вы уверены, что хотите удалить все данные? Это действие нельзя отменить.')) {
        localStorage.clear();
        showNotification('Все данные удалены', 'success');
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    }
}

// Функция очистки всех данных
function clearAllData() {
    if (!confirm('Вы уверены, что хотите удалить ВСЕ данные? Это действие нельзя отменить!')) {
        return;
    }

    try {
        // Очищаем все данные из localStorage
        localStorage.removeItem('workouts');
        localStorage.removeItem('exercises');
        localStorage.removeItem('completedWorkouts');

        // Показываем уведомление об успехе
        showNotification('success', 'Все данные успешно удалены');

        // Перезагружаем страницу через 1 секунду
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    } catch (error) {
        showNotification('error', 'Ошибка при удалении данных');
        console.error('Ошибка при удалении данных:', error);
    }
}

// Функция очистки истории
function clearHistory() {
    if (!confirm('Вы уверены, что хотите очистить всю историю тренировок? Это действие нельзя отменить!')) {
        return;
    }

    try {
        // Получаем текущие тренировки
        const workouts = JSON.parse(localStorage.getItem('workouts') || '[]');

        // Оставляем только незавершенные и неудаленные тренировки
        const activeWorkouts = workouts.filter(w => !w.completed && !w.deleted);

        // Сохраняем только активные тренировки
        localStorage.setItem('workouts', JSON.stringify(activeWorkouts));

        // Очищаем отдельное хранилище завершенных тренировок, если оно есть
        localStorage.removeItem('completedWorkouts');

        // Показываем уведомление об успехе
        showNotification('success', 'История тренировок успешно очищена');

        // Перезагружаем страницу через 1 секунду
        setTimeout(() => {
            window.location.reload();
        }, 2000);
    } catch (error) {
        showNotification('error', 'Ошибка при очистке истории');
        console.error('Ошибка при очистке истории:', error);
    }
}

// Функция отображения уведомлений
function showNotification(type, message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type === 'success' ? 'success' : 'danger'} alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3`;
    alertDiv.style.zIndex = '1050';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    document.body.appendChild(alertDiv);

    // Автоматически удаляем уведомление через 3 секунды
    setTimeout(() => {
        alertDiv.remove();
    }, 3000);
}