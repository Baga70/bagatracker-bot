// Глобальные переменные
let workouts = [];
let currentPage = 1;
const itemsPerPage = 15;
let isSelectionMode = false;
let selectedWorkouts = new Set();

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    loadWorkouts();
    initializeFilters();
    setupFilters();
    setupSelectionMode();
});

// Настройка фильтров
function setupFilters() {
    const periodFilter = document.getElementById('period-filter');
    const typeFilter = document.getElementById('type-filter');
    const dateFilter = document.getElementById('date-filter');

    if (periodFilter) periodFilter.addEventListener('change', applyFilters);
    if (typeFilter) typeFilter.addEventListener('change', applyFilters);
    if (dateFilter) dateFilter.addEventListener('change', applyFilters);
}

// Настройка режима выбора
function setupSelectionMode() {
    const selectBtn = document.getElementById('select-workouts-btn');
    const deleteBtn = document.getElementById('delete-selected-btn');

    selectBtn.addEventListener('click', () => {
        isSelectionMode = !isSelectionMode;
        selectedWorkouts.clear();

        if (isSelectionMode) {
            selectBtn.classList.add('active');
            deleteBtn.style.display = 'inline-block';
            document.querySelectorAll('.workout-card').forEach(card => {
                card.classList.add('selectable');
                card.addEventListener('click', handleCardClick);
            });
        } else {
            selectBtn.classList.remove('active');
            deleteBtn.style.display = 'none';
            document.querySelectorAll('.workout-card').forEach(card => {
                card.classList.remove('selectable', 'selected');
                card.removeEventListener('click', handleCardClick);
            });
        }
    });

    deleteBtn.addEventListener('click', () => {
        if (selectedWorkouts.size === 0) {
            showNotification('Выберите тренировки для удаления', 'warning');
            return;
        }

        if (confirm(`Вы уверены, что хотите удалить ${selectedWorkouts.size} тренировок?`)) {
            deleteSelectedWorkouts();
        }
    });
}

// Обработчик клика по карточке
function handleCardClick(event) {
    event.preventDefault();
    event.stopPropagation();

    const card = event.currentTarget;

    if (!card.classList.contains('workout-card')) {
        return;
    }

    toggleWorkoutSelection(card);
}

// Переключение выбора тренировки
function toggleWorkoutSelection(card) {
    const workoutId = card.dataset.workoutId;
    if (!workoutId) return;

    if (selectedWorkouts.has(workoutId)) {
        selectedWorkouts.delete(workoutId);
        card.classList.remove('selected');
    } else {
        selectedWorkouts.add(workoutId);
        card.classList.add('selected');
    }
}

// Удаление выбранных тренировок
function deleteSelectedWorkouts() {
    workouts = workouts.filter(workout => !selectedWorkouts.has(workout.id.toString()));
    localStorage.setItem('workouts', JSON.stringify(workouts));
    selectedWorkouts.clear();
    isSelectionMode = false;

    document.getElementById('select-workouts-btn').classList.remove('active');
    document.getElementById('delete-selected-btn').style.display = 'none';

    showNotification('Выбранные тренировки удалены', 'success');
    applyFilters();
}

// Загрузка тренировок
function loadWorkouts() {
    workouts = JSON.parse(localStorage.getItem('workouts')) || [];
    applyFilters();
}

// Применение фильтров
function applyFilters() {
    const periodFilter = document.getElementById('period-filter').value;
    const typeFilter = document.getElementById('type-filter').value;
    const dateFilter = document.getElementById('date-filter').value;

    let filteredWorkouts = [...workouts].filter(workout => workout.completed); // Только завершенные тренировки

    // Фильтр по типу тренировки
    if (typeFilter && typeFilter !== 'all') {
        filteredWorkouts = filteredWorkouts.filter(workout => {
            // Приводим оба значения к нижнему регистру для сравнения
            const workoutType = workout.type ? workout.type.toLowerCase() : '';
            return workoutType === typeFilter.toLowerCase();
        });
    }

    // Фильтр по конкретной дате
    if (dateFilter) {
        const filterDate = new Date(dateFilter);
        filterDate.setHours(0, 0, 0, 0);

        filteredWorkouts = filteredWorkouts.filter(workout => {
            const workoutDate = new Date(workout.date);
            workoutDate.setHours(0, 0, 0, 0);
            return workoutDate.getTime() === filterDate.getTime();
        });
    } else {
        // Фильтр по периоду
        const now = new Date();
        now.setHours(23, 59, 59, 999);
        let startDate = new Date();
        startDate.setHours(0, 0, 0, 0);

        switch (periodFilter) {
            case 'day':
                startDate.setDate(now.getDate() - 1);
                break;
            case 'week':
                startDate.setDate(now.getDate() - 7);
                break;
            case 'month':
                startDate.setMonth(now.getMonth() - 1);
                break;
            case 'three_months':
                startDate.setMonth(now.getMonth() - 3);
                break;
            case 'six_months':
                startDate.setMonth(now.getMonth() - 6);
                break;
            case 'year':
                startDate.setFullYear(now.getFullYear() - 1);
                break;
            default:
                startDate = new Date(0);
        }

        filteredWorkouts = filteredWorkouts.filter(workout => {
            const workoutDate = new Date(workout.date);
            return workoutDate >= startDate && workoutDate <= now;
        });
    }

    // Сортировка по дате (сначала новые)
    filteredWorkouts.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Сброс текущей страницы при изменении фильтров
    currentPage = 1;
    displayWorkouts(filteredWorkouts);
}

// Отображение тренировок
function displayWorkouts(workoutsToDisplay) {
    const container = document.getElementById('workout-history');
    const loadMoreContainer = document.getElementById('load-more-container');

    if (!container) return;

    // Очищаем контейнер при первой странице
    if (currentPage === 1) {
        container.innerHTML = '';
    }

    if (workoutsToDisplay.length === 0) {
        container.innerHTML = '<div class="alert alert-info">Нет завершенных тренировок</div>';
        if (loadMoreContainer) loadMoreContainer.style.display = 'none';
        return;
    }

    // Вычисляем индексы для текущей страницы
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const workoutsToShow = workoutsToDisplay.slice(startIndex, endIndex);

    // Добавляем карточки тренировок
    workoutsToShow.forEach(workout => {
        const card = createWorkoutCard(workout);
        container.appendChild(card);
    });

    // Управление кнопкой "Загрузить ещё"
    if (loadMoreContainer) {
        loadMoreContainer.style.display = endIndex < workoutsToDisplay.length ? 'block' : 'none';
    }
}

// Создание карточки тренировки
function createWorkoutCard(workout) {
    const card = document.createElement('div');
    card.className = 'card mb-3 workout-card';
    card.dataset.workoutId = workout.id;
    card.innerHTML = `
        <div class="card-body">
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h5 class="card-title">${workout.name}</h5>
                <div class="badge bg-${getTypeColor(workout.type)}">${getWorkoutType(workout.type)}</div>
            </div>
            <div class="mb-3">
                <small class="text-muted">
                    <i class="bi bi-calendar"></i> ${formatDate(workout.date)}
                    ${workout.time ? `<i class="bi bi-clock ms-2"></i> ${workout.time}` : ''}
                </small>
            </div>
            <div class="exercises-list mb-3">
                ${createExercisesList(workout.exercises)}
            </div>
            ${workout.notes ? `
                <div class="mb-3">
                    <small class="text-muted">
                        <i class="bi bi-journal-text"></i> ${workout.notes}
                    </small>
                </div>
            ` : ''}
            <div class="d-flex justify-content-between align-items-center">
                <div class="btn-group">
                    <button class="btn btn-sm btn-outline-primary" onclick="editWorkout('${workout.id}')">
                        <i class="bi bi-pencil"></i> Редактировать
                    </button>
                    <button class="btn btn-sm btn-outline-success" onclick="duplicateWorkout('${workout.id}')">
                        <i class="bi bi-files"></i> Дублировать
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteWorkout('${workout.id}')">
                        <i class="bi bi-trash"></i> Удалить
                    </button>
                </div>
                <button class="btn btn-sm btn-outline-info" onclick="shareWorkout('${workout.id}')">
                    <i class="bi bi-share"></i> Поделиться
                </button>
            </div>
        </div>
    `;
    return card;
}

// Создание списка упражнений
function createExercisesList(exercises) {
    if (!exercises || exercises.length === 0) {
        return '<p class="text-muted mb-0">Нет упражнений</p>';
    }

    return exercises.map(exercise => `
        <div class="exercise-item">
            <strong>${exercise.name}</strong>
            <div class="text-muted">
                ${exercise.type === 'reps' ? 
                    `${exercise.sets} подходов × ${exercise.reps} повторений ${exercise.weight ? `• ${exercise.weight} кг` : ''}` : 
                    `${exercise.duration} минут`}
            </div>
        </div>
    `).join('');
}

// Загрузка дополнительных тренировок
function loadMoreWorkouts() {
    currentPage++;
    applyFilters();
}

// Вспомогательные функции
function formatDate(dateString) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('ru-RU', options);
}

// Инициализация фильтров
function initializeFilters() {
    const typeFilter = document.getElementById('type-filter');
    if (typeFilter) {
        const workoutTypes = [
            { value: 'all', label: 'Все типы' },
            { value: 'силовая', label: 'Силовая' },
            { value: 'кардио', label: 'Кардио' },
            { value: 'растяжка', label: 'Растяжка' }
        ];

        typeFilter.innerHTML = workoutTypes.map(type => 
            `<option value="${type.value}">${type.label}</option>`
        ).join('');
    }
}

// Вспомогательные функции для отображения типов тренировок
function getTypeColor(type) {
    if (!type) return 'secondary';
    
    switch(type.toLowerCase()) {
        case 'силовая':
            return 'primary';
        case 'кардио':
            return 'success';
        case 'растяжка':
            return 'info';
        default:
            return 'secondary';
    }
}

function getWorkoutType(type) {
    if (!type) return 'Без типа';
    
    switch(type.toLowerCase()) {
        case 'силовая':
            return 'Силовая';
        case 'кардио':
            return 'Кардио';
        case 'растяжка':
            return 'Растяжка';
        default:
            return type;
    }
}

// Функция для создания PDF из тренировки
async function createWorkoutPDF(workout) {
    try {
        // Создаем canvas с меньшим масштабом
        const canvas = document.createElement('canvas');
        const scale = 1.5; // Уменьшаем масштаб для оптимизации размера
        canvas.width = 595 * scale;
        canvas.height = 842 * scale;
        
        const ctx = canvas.getContext('2d');
        ctx.scale(scale, scale);
        
        // Устанавливаем белый фон
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'black';
        
        // Заголовок
        ctx.font = 'bold 20px Arial';
        ctx.fillText(`Тренировка: ${workout.name || 'Без названия'}`, 30, 30);
        
        // Тип тренировки и дата
        ctx.font = '14px Arial';
        ctx.fillText(`Тип: ${getWorkoutType(workout.type)}`, 30, 60);
        ctx.fillText(`Дата: ${formatDate(workout.date)}`, 30, 80);
        if (workout.time) {
            ctx.fillText(`Время: ${workout.time}`, 30, 100);
        }
        
        // Упражнения
        let yPos = 130;
        ctx.font = 'bold 16px Arial';
        ctx.fillText('Упражнения:', 30, yPos);
        yPos += 25;
        
        ctx.font = '14px Arial';
        if (workout.exercises && workout.exercises.length > 0) {
            for (const exercise of workout.exercises) {
                const exerciseText = exercise.type === 'reps' ?
                    `${exercise.name}: ${exercise.sets} × ${exercise.reps} ${exercise.weight ? `• ${exercise.weight}кг` : ''}` :
                    `${exercise.name}: ${exercise.duration} мин`;
                
                // Проверяем необходимость новой страницы
                if (yPos > 780) {
                    // Сохраняем текущую страницу
                    const img = canvas.toDataURL('image/jpeg', 0.8); // Используем JPEG с компрессией
                    
                    // Инициализируем PDF
                    window.jsPDF = window.jspdf.jsPDF;
                    const doc = new jsPDF();
                    doc.addImage(img, 'JPEG', 0, 0, 210, 297);
                    
                    // Очищаем и подготавливаем новую страницу
                    ctx.fillStyle = 'white';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.fillStyle = 'black';
                    ctx.font = '14px Arial';
                    yPos = 30;
                }
                
                ctx.fillText(exerciseText, 30, yPos);
                yPos += 20;
            }
        } else {
            ctx.fillText('Нет упражнений', 30, yPos);
            yPos += 20;
        }
        
        // Заметки
        if (workout.notes) {
            if (yPos > 740) {
                yPos = 30;
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = 'black';
            }
            ctx.font = 'bold 16px Arial';
            ctx.fillText('Заметки:', 30, yPos);
            yPos += 25;
            ctx.font = '14px Arial';
            ctx.fillText(workout.notes, 30, yPos);
        }
        
        // Конвертируем canvas в сжатое изображение
        const finalImg = canvas.toDataURL('image/jpeg', 0.8);
        
        // Создаем PDF с оптимизированными настройками
        window.jsPDF = window.jspdf.jsPDF;
        const doc = new jsPDF({
            compress: true
        });
        
        // Добавляем изображение в PDF с оптимизированными размерами
        doc.addImage(finalImg, 'JPEG', 0, 0, 210, 297);
        
        // Сохраняем PDF
        doc.save('workout.pdf');
        showNotification('PDF успешно создан', 'success');
        
    } catch (error) {
        console.error('Ошибка при создании PDF:', error);
        showNotification('Ошибка при создании PDF', 'error');
    }
}

// Функция для поделиться тренировкой
async function shareWorkout(workoutId) {
    try {
        const workouts = JSON.parse(localStorage.getItem('workouts')) || [];
        const workout = workouts.find(w => w.id.toString() === workoutId.toString());
        
        if (!workout) {
            showNotification('Тренировка не найдена', 'error');
            return;
        }
        
        await window.pdfGenerator.createWorkoutPDF(workout);
        showNotification('PDF успешно создан', 'success');
    } catch (error) {
        console.error('Ошибка при создании PDF:', error);
        showNotification('Ошибка при создании PDF', 'error');
    }
}

// Функция отображения уведомлений
function showNotification(message, type = 'info') {
    // Создаем элемент уведомления
    const notification = document.createElement('div');
    notification.className = 'snackbar';
    notification.style.cssText = `
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%);
        background-color: #323232;
        color: white;
        padding: 14px 24px;
        border-radius: 4px;
        box-shadow: 0 3px 5px rgba(0, 0, 0, 0.2);
        z-index: 1050;
        display: flex;
        align-items: center;
        min-width: 288px;
        max-width: 90%;
        font-size: 14px;
        line-height: 1.5;
        opacity: 0;
        transition: opacity 0.3s ease-in-out;
    `;

    // Добавляем текст сообщения
    notification.textContent = message;

    // Добавляем уведомление на страницу
    document.body.appendChild(notification);

    // Показываем уведомление
    setTimeout(() => {
        notification.style.opacity = '1';
    }, 10);

    // Автоматически удаляем уведомление через 4 секунды
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 4000);
}