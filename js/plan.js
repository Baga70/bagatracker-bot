// Хранение данных
let workouts = JSON.parse(localStorage.getItem('workouts')) || [];
let exercises = JSON.parse(localStorage.getItem('exercises')) || [];

// Текущий план тренировки
let currentWorkoutPlan = {
    exercises: [],
    type: 'силовая' // Добавляем начальный тип тренировки
};

let currentEditingWorkoutId = null;

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    loadWorkouts();
    setupWorkoutForm();
    setupExerciseTypeHandler();
    loadNextWorkout();
});

// Настройка обработчика типа упражнения
function setupExerciseTypeHandler() {
    const exerciseType = document.getElementById('exercise-type');
    if (exerciseType) {
        exerciseType.addEventListener('change', toggleExerciseInputs);
    }
}

// Переключение полей ввода в зависимости от типа упражнения
function toggleExerciseInputs() {
    const exerciseType = document.getElementById('exercise-type').value;
    const repsInputs = document.getElementById('reps-inputs');
    const timeInputs = document.getElementById('time-inputs');

    if (exerciseType === 'reps') {
        repsInputs.style.display = 'block';
        timeInputs.style.display = 'none';
    } else {
        repsInputs.style.display = 'none';
        timeInputs.style.display = 'block';
    }
}

// Настройка формы создания тренировки
function setupWorkoutForm() {
    const form = document.getElementById('workout-form');
    if (!form) return;

    form.addEventListener('submit', handleWorkoutSubmit);

    // Добавляем обработчик изменения типа тренировки
    const workoutType = document.getElementById('workout-type');
    if (workoutType) {
        workoutType.addEventListener('change', function() {
            const newType = this.value;
            if (currentWorkoutPlan.exercises && currentWorkoutPlan.exercises.length > 0) {
                if (confirm('При изменении типа тренировки все упражнения будут удалены. Продолжить?')) {
                    // Очищаем упражнения
                    currentWorkoutPlan.exercises = [];
                    // Обновляем тип тренировки
                    currentWorkoutPlan.type = newType;
                    // Обновляем отображение
                    updateExercisesContainer();
                    // Показываем уведомление
                    showNotification('Тип тренировки изменен, упражнения удалены', 'success');
                } else {
                    // Возвращаем предыдущее значение
                    this.value = currentWorkoutPlan.type;
                }
            } else {
                // Если нет упражнений, просто обновляем тип
                currentWorkoutPlan.type = newType;
            }
        });
    }
}

// Обработка отправки формы
function handleWorkoutSubmit(event) {
    event.preventDefault();

    const workout = {
        id: Date.now().toString(),
        name: document.getElementById('workout-name').value,
        type: document.getElementById('workout-type').value,
        date: document.getElementById('workout-date').value,
        time: document.getElementById('workout-time').value,
        notes: document.getElementById('workout-notes').value,
        exercises: currentWorkoutPlan.exercises,
        completed: false
    };

    saveWorkout(workout);
    event.target.reset();
    currentWorkoutPlan.exercises = []; // Очищаем список упражнений
    currentWorkoutPlan.type = 'силовая'; // Сбрасываем тип тренировки
    updateExercisesContainer();
    loadWorkouts();
}

// Сохранение тренировки
function saveWorkout(workout) {
    const workouts = JSON.parse(localStorage.getItem('workouts') || '[]');
    workouts.push(workout);
    localStorage.setItem('workouts', JSON.stringify(workouts));
}

// Загрузка тренировок
function loadWorkouts() {
    workouts = JSON.parse(localStorage.getItem('workouts')) || [];
    const plannedWorkouts = workouts.filter(workout => !workout.completed && !workout.deleted);
    displayWorkouts(plannedWorkouts);
}

// Отображение тренировок
function displayWorkouts(workoutsToShow) {
    const container = document.getElementById('workout-plan');
    container.innerHTML = '';

    if (workoutsToShow.length === 0) {
        container.innerHTML = '<p class="text-muted">Нет запланированных тренировок</p>';
        return;
    }

    workoutsToShow.forEach(workout => {
                const card = document.createElement('div');
                card.className = 'card mb-3 workout-card';
                card.dataset.workoutId = workout.id;
                card.innerHTML = `
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h5 class="card-title">${workout.name}</h5>
                    <div class="badge bg-${getTypeColor(workout.type)}">${getTypeName(workout.type)}</div>
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
        container.appendChild(card);
    });
}

// Создание списка упражнений
function createExercisesList(exercises) {
    if (!exercises || exercises.length === 0) {
        return '<p class="text-muted mb-0">Нет добавленных упражнений</p>';
    }

    return exercises.map(exercise => `
        <div class="exercise-item mb-2">
            <strong>${exercise.name}</strong>
            <div class="text-muted">
                ${exercise.type === 'reps' ? 
                    `${exercise.sets} подходов × ${exercise.reps} повторений ${exercise.weight ? `• ${exercise.weight} кг` : ''}` : 
                    `${exercise.duration} минут`}
            </div>
        </div>
    `).join('');
}

// Завершение тренировки
function completeWorkout(workoutId) {
    if (!confirm('Вы уверены, что хотите завершить эту тренировку?')) {
        return;
    }

    const workouts = JSON.parse(localStorage.getItem('workouts')) || [];
    const workoutIndex = workouts.findIndex(w => w.id === workoutId);

    if (workoutIndex !== -1) {
        // Отмечаем тренировку как завершенную
        workouts[workoutIndex].completed = true;
        workouts[workoutIndex].completedDate = new Date().toISOString();
        
        // Сохраняем обновленный список тренировок
        localStorage.setItem('workouts', JSON.stringify(workouts));
        
        // Обновляем отображение
        loadWorkouts();
    }
}

// Удаление тренировки
function deleteWorkout(workoutId) {
    if (!confirm('Вы уверены, что хотите удалить эту тренировку?')) {
        return;
    }

    const workouts = JSON.parse(localStorage.getItem('workouts')) || [];
    const workoutIndex = workouts.findIndex(w => w.id === workoutId);

    if (workoutIndex !== -1) {
        // Отмечаем тренировку как удаленную
        workouts[workoutIndex].deleted = true;
        workouts[workoutIndex].deletedDate = new Date().toISOString();
        
        // Сохраняем обновленный список тренировок
        localStorage.setItem('workouts', JSON.stringify(workouts));
        
        // Обновляем отображение
        loadWorkouts();
    }
}

// Форматирование даты
function formatDate(dateString) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('ru-RU', options);
}

// Получение названия типа тренировки
function getWorkoutTypeName(type) {
    const types = {
        'силовое': 'Силовая',
        'кардио': 'Кардио',
        'растяжка': 'Растяжка'
    };
    return types[type] || type;
}

// Инициализация модального окна
function initializeExerciseModal() {
    const exerciseSelect = document.getElementById('exercise-select');
    exerciseSelect.innerHTML = '<option value="">Выберите упражнение</option>';

    exercises.forEach(exercise => {
        const option = document.createElement('option');
        option.value = exercise.id;
        option.textContent = exercise.name;
        exerciseSelect.appendChild(option);
    });
}

// Добавление упражнения в план
function addExerciseToPlan() {
    const modal = new bootstrap.Modal(document.getElementById('addExerciseModal'));
    const exerciseSelect = document.getElementById('exercise-select');
    const workoutType = document.getElementById('workout-type').value;

    // Получаем все упражнения
    const exercises = JSON.parse(localStorage.getItem('exercises') || '[]');
    
    // Маппинг типов тренировок на типы упражнений
    const typeMapping = {
        'силовая': 'силовое',
        'кардио': 'кардио',
        'растяжка': 'растяжка'
    };
    
    // Фильтруем упражнения по типу тренировки
    const filteredExercises = exercises.filter(exercise => {
        return exercise.type === typeMapping[workoutType];
    });

    // Обновляем список упражнений в модальном окне
    exerciseSelect.innerHTML = '<option value="">Выберите упражнение</option>';
    filteredExercises.sort((a, b) => a.name.localeCompare(b.name)).forEach(exercise => {
        exerciseSelect.innerHTML += `<option value="${exercise.id}">${exercise.name}</option>`;
    });

    modal.show();
}

// Сохранение упражнения в план
function saveExerciseToPlan() {
    const exerciseId = document.getElementById('exercise-select').value;
    const exerciseType = document.getElementById('exercise-type').value;
    
    if (!exerciseId) {
        showNotification('Выберите упражнение из списка', 'error');
        return;
    }

    const exercises = JSON.parse(localStorage.getItem('exercises') || '[]');
    const exercise = exercises.find(e => e.id === parseInt(exerciseId));

    if (!exercise) {
        showNotification('Упражнение не найдено', 'error');
        return;
    }

    const updatedExercise = {
        id: parseInt(exerciseId),
        name: exercise.name,
        type: exerciseType
    };

    if (exerciseType === 'reps') {
        const sets = parseInt(document.getElementById('exercise-sets').value);
        const reps = parseInt(document.getElementById('exercise-reps').value);
        const weight = parseFloat(document.getElementById('exercise-weight').value) || 0;

        if (!sets || !reps) {
            showNotification('Заполните все обязательные поля', 'error');
            return;
        }

        updatedExercise.sets = sets;
        updatedExercise.reps = reps;
        updatedExercise.weight = weight;
    } else {
        const duration = parseInt(document.getElementById('exercise-duration').value);

        if (!duration) {
            showNotification('Укажите длительность упражнения', 'error');
            return;
        }

        updatedExercise.duration = duration;
    }

    // Добавляем упражнение в текущий план
    if (!currentWorkoutPlan.exercises) {
        currentWorkoutPlan.exercises = [];
    }
    currentWorkoutPlan.exercises.push(updatedExercise);

    // Обновляем отображение
    updateExercisesContainer();

    // Закрываем модальное окно
    const modal = document.getElementById('addExerciseModal');
    const bsModal = bootstrap.Modal.getInstance(modal);
    bsModal.hide();

    // Очищаем форму
    document.getElementById('exercise-form').reset();

    showNotification('Упражнение добавлено', 'success');
}

// Обновление контейнера упражнений
function updateExercisesContainer() {
    const container = document.getElementById('exerciseList');
    if (!container) return;

    if (currentWorkoutPlan.exercises.length === 0) {
        container.innerHTML = '<p class="text-muted">Нет добавленных упражнений</p>';
        return;
    }

    container.innerHTML = '';
    currentWorkoutPlan.exercises.forEach((exercise, index) => {
        const exerciseElement = document.createElement('div');
        exerciseElement.className = 'list-group-item d-flex justify-content-between align-items-center';
        exerciseElement.id = `exercise-${index}`;
        exerciseElement.draggable = true;
        exerciseElement.ondragstart = drag;
        exerciseElement.setAttribute('data-exercise-id', index);
        exerciseElement.setAttribute('data-exercise', JSON.stringify(exercise));
        
        let exerciseDetails = '';
        if (exercise.type === 'reps') {
            exerciseDetails = `${exercise.sets} × ${exercise.reps} × ${exercise.weight} кг`;
        } else {
            exerciseDetails = `${exercise.duration} мин`;
        }

        exerciseElement.innerHTML = `
            <div class="d-flex justify-content-between align-items-center w-100">
                <div>
                    <h6 class="mb-0">${exercise.name}</h6>
                    <small class="text-muted">${exerciseDetails}</small>
                </div>
                <button class="btn btn-sm btn-danger" onclick="removeExerciseFromPlan(${index})">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        `;
        container.appendChild(exerciseElement);
    });
}

// Удаление упражнения из плана
function removeExerciseFromPlan(index) {
    if (!confirm('Вы уверены, что хотите удалить это упражнение?')) {
        return;
    }
    currentWorkoutPlan.exercises.splice(index, 1);
    updateExercisesContainer();
}

// Редактирование тренировки
function editWorkout(id) {
    const workout = workouts.find(w => w.id === id);
    if (!workout) return;

    // Сохраняем ID тренировки в модальном окне
    const editWorkoutModal = document.getElementById('editWorkoutModal');
    editWorkoutModal.setAttribute('data-workout-id', id);
    currentEditingWorkoutId = id;

    // Заполняем форму данными тренировки
    document.getElementById('edit-workout-name').value = workout.name;
    document.getElementById('edit-workout-type').value = workout.type;
    document.getElementById('edit-workout-date').value = workout.date;
    document.getElementById('edit-workout-time').value = workout.time;
    document.getElementById('edit-workout-notes').value = workout.notes || '';

    // Очищаем и заполняем список упражнений
    const exercisesContainer = document.getElementById('edit-exercises-container');
    exercisesContainer.innerHTML = '';
    
    if (workout.exercises && workout.exercises.length > 0) {
        workout.exercises.forEach((exercise, index) => {
            const exerciseElement = document.createElement('div');
            exerciseElement.className = 'exercise-item mb-2 p-2 border rounded';
            exerciseElement.setAttribute('draggable', 'true');
            exerciseElement.setAttribute('ondragstart', 'dragEdit(event)');
            exerciseElement.setAttribute('ondragover', 'allowDropEdit(event)');
            exerciseElement.setAttribute('ondrop', 'dropEdit(event)');
            exerciseElement.setAttribute('data-exercise-id', index);
            exerciseElement.setAttribute('data-exercise', JSON.stringify(exercise));

            exerciseElement.innerHTML = `
                                        <div class="d-flex justify-content-between align-items-center">
                                            <div>
                                                <h6 class="mb-0">${exercise.name}</h6>
                                                <small class="text-muted">
                                                    ${exercise.type === 'reps' ? 
                                `${exercise.sets} подходов × ${exercise.reps} повторений ${exercise.weight ? `• ${exercise.weight} кг` : ''}` : 
                                `${exercise.duration} минут`}
                                                </small>
                                            </div>
                    <div>
                        <button type="button" class="btn btn-sm btn-outline-primary me-2" onclick="editExerciseInWorkout(${index})">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button type="button" class="btn btn-sm btn-outline-danger" onclick="removeExerciseFromEdit(${index}, '${id}')">
                                                <i class="bi bi-trash"></i>
                                            </button>
            </div>
        </div>
    `;
            exercisesContainer.appendChild(exerciseElement);
        });
    } else {
        exercisesContainer.innerHTML = '<p class="text-muted">Нет добавленных упражнений</p>';
    }

    // Удаляем старый обработчик события, если он есть
    const oldTypeSelect = document.getElementById('edit-workout-type');
    const newTypeSelect = oldTypeSelect.cloneNode(true);
    oldTypeSelect.parentNode.replaceChild(newTypeSelect, oldTypeSelect);

    // Добавляем новый обработчик события изменения типа
    newTypeSelect.addEventListener('change', function() {
        const newType = this.value;
        if (newType === 'выбрать') {
            // Возвращаем предыдущее значение
            this.value = workout.type;
            return;
        }
        
        if (newType !== workout.type) {
            if (confirm('При изменении типа тренировки все упражнения будут удалены. Продолжить?')) {
                // Очищаем упражнения
                workout.exercises = [];
                // Обновляем тип тренировки
                workout.type = newType;
                
                // Обновляем тренировку в глобальном массиве
                const workoutIndex = workouts.findIndex(w => w.id === id);
                if (workoutIndex !== -1) {
                    workouts[workoutIndex] = workout;
                }
                
                // Сохраняем изменения
                localStorage.setItem('workouts', JSON.stringify(workouts));
                
                // Очищаем отображение упражнений в модальном окне
                const exercisesContainer = document.getElementById('edit-exercises-container');
                exercisesContainer.innerHTML = '';
                
                // Обновляем отображение
                loadWorkouts();
                // Показываем уведомление
                showNotification('Тип тренировки изменен', 'success');
            } else {
                // Возвращаем предыдущее значение
                this.value = workout.type;
            }
        }
    });

    // Показываем модальное окно
    const modal = new bootstrap.Modal(editWorkoutModal);
    modal.show();
}

// Добавление упражнения при редактировании
function addExerciseToEdit() {
    const workoutId = document.getElementById('editWorkoutModal').getAttribute('data-workout-id');
    if (!workoutId) {
        showNotification('Ошибка: ID тренировки не найден', 'error');
        return;
    }

    const workouts = JSON.parse(localStorage.getItem('workouts') || '[]');
    const workout = workouts.find(w => w.id === workoutId);
    
    if (!workout) {
        showNotification('Ошибка: тренировка не найдена', 'error');
        return;
    }

    // Скрываем модальное окно редактирования тренировки
    const editWorkoutModal = document.getElementById('editWorkoutModal');
    editWorkoutModal.style.display = 'none';

    // Получаем тип тренировки
    const workoutType = workout.type;

    // Маппинг типов тренировок на типы упражнений
    const typeMapping = {
        'силовая': 'силовое',
        'кардио': 'кардио',
        'растяжка': 'растяжка'
    };

    // Получаем и фильтруем упражнения по типу тренировки
    const exercises = JSON.parse(localStorage.getItem('exercises') || '[]');
    const filteredExercises = exercises.filter(ex => ex.type === typeMapping[workoutType]);

    // Обновляем список упражнений в модальном окне
    const exerciseSelect = document.getElementById('exercise-select-edit');
    exerciseSelect.innerHTML = '<option value="">Выберите упражнение</option>';
    
    filteredExercises.sort((a, b) => a.name.localeCompare(b.name)).forEach(ex => {
        const option = document.createElement('option');
        option.value = ex.id;
        option.textContent = ex.name;
        exerciseSelect.appendChild(option);
    });

    // Очищаем форму
    document.getElementById('exercise-type-edit').value = 'reps';
    document.getElementById('exercise-sets-edit').value = '';
    document.getElementById('exercise-reps-edit').value = '';
    document.getElementById('exercise-weight-edit').value = '';
    document.getElementById('exercise-duration-edit').value = '';
    toggleEditExerciseInputs();

    // Добавляем обработчик закрытия модального окна
    const editExerciseModal = document.getElementById('addExerciseEditModal');
    editExerciseModal.addEventListener('hidden.bs.modal', () => {
        // Показываем модальное окно редактирования тренировки
        editWorkoutModal.style.display = 'block';
    });

    // Открываем модальное окно
    const modal = new bootstrap.Modal(editExerciseModal);
    modal.show();
}

function toggleEditExerciseInputs() {
    const exerciseType = document.getElementById('exercise-type-edit').value;
    const repsInputs = document.getElementById('reps-inputs-edit');
    const timeInputs = document.getElementById('time-inputs-edit');

    if (exerciseType === 'reps') {
        repsInputs.style.display = 'block';
        timeInputs.style.display = 'none';
    } else {
        repsInputs.style.display = 'none';
        timeInputs.style.display = 'block';
    }
}

function editExerciseInWorkout(index) {
    const workoutId = document.getElementById('editWorkoutModal').getAttribute('data-workout-id');
    const workouts = JSON.parse(localStorage.getItem('workouts') || '[]');
    const workout = workouts.find(w => w.id === workoutId);
    
    if (!workout || !workout.exercises[index]) {
        showNotification('Ошибка: упражнение не найдено', 'error');
        return;
    }

    const exercise = workout.exercises[index];
    
    // Скрываем модальное окно редактирования тренировки
    const editWorkoutModal = document.getElementById('editWorkoutModal');
    editWorkoutModal.style.display = 'none';
    
    // Загружаем упражнения в выпадающий список
    const exerciseSelect = document.getElementById('exercise-select-edit');
    const exercises = JSON.parse(localStorage.getItem('exercises') || '[]');
    
    // Маппинг типов тренировок на типы упражнений
    const typeMapping = {
        'силовая': 'силовое',
        'кардио': 'кардио',
        'растяжка': 'растяжка'
    };
    
    // Фильтруем упражнения по типу тренировки
    const filteredExercises = exercises.filter(ex => ex.type === typeMapping[workout.type]);
    
    // Очищаем текущий список
    exerciseSelect.innerHTML = '<option value="">Выберите упражнение</option>';
    
    // Добавляем отфильтрованные упражнения в список
    filteredExercises.sort((a, b) => a.name.localeCompare(b.name)).forEach(ex => {
        const option = document.createElement('option');
        option.value = ex.id;
        option.textContent = ex.name;
        exerciseSelect.appendChild(option);
    });
    
    // Устанавливаем выбранное упражнение
    exerciseSelect.value = exercise.id;
    
    // Устанавливаем тип упражнения
    const exerciseType = document.getElementById('exercise-type-edit');
    exerciseType.value = exercise.type;
    
    // Показываем/скрываем соответствующие поля ввода
    const repsInputs = document.getElementById('reps-inputs-edit');
    const timeInputs = document.getElementById('time-inputs-edit');
    
    if (exercise.type === 'reps') {
        repsInputs.style.display = 'block';
        timeInputs.style.display = 'none';
        document.getElementById('exercise-sets-edit').value = exercise.sets;
        document.getElementById('exercise-reps-edit').value = exercise.reps;
        document.getElementById('exercise-weight-edit').value = exercise.weight || '';
    } else {
        repsInputs.style.display = 'none';
        timeInputs.style.display = 'block';
        document.getElementById('exercise-duration-edit').value = exercise.duration;
    }
    
    // Сохраняем индекс редактируемого упражнения
    sessionStorage.setItem('editingExerciseIndex', index);
    
    // Добавляем обработчик закрытия модального окна
    const editExerciseModal = document.getElementById('addExerciseEditModal');
    editExerciseModal.addEventListener('hidden.bs.modal', () => {
        // Показываем модальное окно редактирования тренировки
        editWorkoutModal.style.display = 'block';
    }, { once: true }); // Добавляем опцию once: true, чтобы обработчик сработал только один раз
    
    // Открываем модальное окно
    const modal = new bootstrap.Modal(editExerciseModal);
    modal.show();
}

function saveExerciseToEdit() {
    const workoutId = document.getElementById('editWorkoutModal').getAttribute('data-workout-id');
    if (!workoutId) {
        showNotification('Ошибка: ID тренировки не найден', 'error');
        return;
    }

    const workoutIndex = workouts.findIndex(w => w.id === workoutId);
    if (workoutIndex === -1) {
        showNotification('Ошибка: тренировка не найдена', 'error');
        return;
    }

    const exerciseId = document.getElementById('exercise-select-edit').value;
    const exerciseType = document.getElementById('exercise-type-edit').value;
    
    if (!exerciseId) {
        showNotification('Выберите упражнение из списка', 'error');
        return;
    }

    const exercises = JSON.parse(localStorage.getItem('exercises') || '[]');
    const exercise = exercises.find(e => e.id === parseInt(exerciseId));

    if (!exercise) {
        showNotification('Упражнение не найдено', 'error');
        return;
    }

    const updatedExercise = {
        id: parseInt(exerciseId),
        name: exercise.name,
        type: exerciseType
    };

    if (exerciseType === 'reps') {
        const sets = parseInt(document.getElementById('exercise-sets-edit').value);
        const reps = parseInt(document.getElementById('exercise-reps-edit').value);
        const weight = parseFloat(document.getElementById('exercise-weight-edit').value) || 0;

        if (!sets || !reps) {
            showNotification('Заполните все обязательные поля', 'error');
            return;
        }

        updatedExercise.sets = sets;
        updatedExercise.reps = reps;
        updatedExercise.weight = weight;
    } else {
        const duration = parseInt(document.getElementById('exercise-duration-edit').value);

        if (!duration) {
            showNotification('Укажите длительность упражнения', 'error');
            return;
        }

        updatedExercise.duration = duration;
    }

    // Проверяем, редактируем ли мы существующее упражнение или добавляем новое
    const editingIndex = sessionStorage.getItem('editingExerciseIndex');
    if (editingIndex !== null) {
        // Редактируем существующее упражнение
        workouts[workoutIndex].exercises[parseInt(editingIndex)] = updatedExercise;
    } else {
        // Добавляем новое упражнение
        if (!workouts[workoutIndex].exercises) {
            workouts[workoutIndex].exercises = [];
        }
        workouts[workoutIndex].exercises.push(updatedExercise);
    }
    
    // Сохраняем изменения в localStorage
    localStorage.setItem('workouts', JSON.stringify(workouts));
        
        // Обновляем отображение
    const container = document.getElementById('edit-exercises-container');
    updateEditExercisesContainer(workouts[workoutIndex].exercises, container, workoutId);

    // Закрываем модальное окно редактирования упражнения
    const editExerciseModal = document.getElementById('addExerciseEditModal');
    const modal = bootstrap.Modal.getInstance(editExerciseModal);
    modal.hide();

    // Очищаем данные редактирования
    sessionStorage.removeItem('editingExerciseIndex');

    showNotification('Упражнение сохранено', 'success');
}

// Обновляем обработчик события изменения типа упражнения в модальном окне редактирования
document.getElementById('exercise-type-edit')?.addEventListener('change', toggleEditExerciseInputs);

// Загрузка ближайшей тренировки на главной странице
async function loadNextWorkout() {
    const workouts = JSON.parse(localStorage.getItem('workouts') || '[]');
    const nextWorkoutContainer = document.getElementById('next-workout');
    const nextWorkoutTitle = document.querySelector('.mt-4 h2');
    
    if (!nextWorkoutContainer) return;

    const now = new Date();
    // Фильтруем тренировки: убираем удаленные, завершенные и прошедшие
    const activeWorkouts = workouts.filter(w => {
        if (w.completed || w.deleted) return false;
        const workoutDateTime = new Date(w.date + 'T' + (w.time || '00:00'));
        return workoutDateTime > now;
    });

    if (activeWorkouts.length === 0) {
        // Скрываем заголовок и контейнер, если нет активных будущих тренировок
        if (nextWorkoutTitle) nextWorkoutTitle.style.display = 'none';
        nextWorkoutContainer.style.display = 'none';
        return;
    }

    // Показываем заголовок и контейнер
    if (nextWorkoutTitle) nextWorkoutTitle.style.display = 'block';
    nextWorkoutContainer.style.display = 'block';

    // Сортируем активные тренировки по дате и времени
    activeWorkouts.sort((a, b) => {
        const dateA = new Date(a.date + 'T' + (a.time || '00:00'));
        const dateB = new Date(b.date + 'T' + (b.time || '00:00'));
        return dateA - dateB;
    });

    // Берем ближайшую тренировку
    const nextWorkout = activeWorkouts[0];
    
    // Отправляем уведомление в Telegram
    try {
        if (window.telegramNotifier) {
            await window.telegramNotifier.sendWorkoutReminder(nextWorkout);
        }
    } catch (error) {
        console.error('Ошибка отправки уведомления в Telegram:', error);
    }

    // Создаем карточку ближайшей тренировки
    nextWorkoutContainer.innerHTML = `
        <div class="card">
            <div class="card-body">
                <h5 class="card-title">Следующая тренировка</h5>
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h6>${nextWorkout.name}</h6>
                    <span class="badge bg-${getTypeColor(nextWorkout.type)}">${getTypeName(nextWorkout.type)}</span>
                </div>
                <p class="card-text">
                    <i class="bi bi-calendar"></i> ${formatDate(nextWorkout.date)}<br>
                    <i class="bi bi-clock"></i> ${nextWorkout.time}
                </p>
                ${nextWorkout.notes ? `<p class="card-text"><i class="bi bi-journal-text"></i> ${nextWorkout.notes}</p>` : ''}
                <div class="exercises-list">
                    <h6><i class="bi bi-list-check"></i> Упражнения:</h6>
                    ${nextWorkout.exercises.map(exercise => `
                        <div class="exercise-item">
                            <div class="d-flex justify-content-between align-items-center">
                                <strong>${exercise.name}</strong>
                                <span class="text-muted">
                                    ${exercise.type === 'reps' ? 
                                        `${exercise.sets} × ${exercise.reps} × ${exercise.weight} кг` : 
                                        `${exercise.duration} мин`}
                                </span>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="mt-3">
                    <a href="plan.html" class="btn btn-primary">
                        <i class="bi bi-calendar2-week"></i> Перейти к плану тренировок
                    </a>
                </div>
            </div>
        </div>
    `;
}

// Получение цвета для типа тренировки
function getTypeColor(type) {
    const colors = {
        'силовая': 'primary',
        'кардио': 'success',
        'растяжка': 'info'
    };
    return colors[type] || 'secondary';
}

// Получение названия типа тренировки
function getTypeName(type) {
    const names = {
        'силовая': 'Силовая',
        'кардио': 'Кардио',
        'растяжка': 'Растяжка'
    };
    return names[type] || type;
}

// Функция дублирования тренировки
function duplicateWorkout(workoutId) {
    const workouts = JSON.parse(localStorage.getItem('workouts') || '[]');
    const originalWorkout = workouts.find(w => w.id === workoutId);
    
    if (!originalWorkout) return;

    // Создаем модальное окно для дублирования
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = 'duplicateWorkoutModal';
    modal.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Дублировать тренировку</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <form id="duplicate-workout-form">
                        <div class="mb-3">
                            <label for="duplicate-workout-name" class="form-label">Название тренировки</label>
                            <input type="text" class="form-control" id="duplicate-workout-name" 
                                value="${originalWorkout.name}" required autocomplete="off">
                        </div>
                        <div class="mb-3">
                            <label for="duplicate-workout-date" class="form-label">Дата</label>
                            <input type="date" class="form-control" id="duplicate-workout-date" required>
                        </div>
                        <div class="mb-3">
                            <label for="duplicate-workout-time" class="form-label">Время</label>
                            <input type="time" class="form-control" id="duplicate-workout-time" 
                                value="${originalWorkout.time || ''}" required>
                        </div>
                        <div class="mb-3">
                            <label for="duplicate-workout-notes" class="form-label">Заметки</label>
                            <textarea class="form-control" id="duplicate-workout-notes" rows="2">${originalWorkout.notes || ''}</textarea>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Отмена</button>
                    <button type="button" class="btn btn-primary" onclick="saveDuplicatedWorkout('${workoutId}')">
                        Создать копию
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();

    // Установка текущей даты в поле даты
    document.getElementById('duplicate-workout-date').valueAsDate = new Date();

    // Удаление модального окна после закрытия
    modal.addEventListener('hidden.bs.modal', function () {
        modal.remove();
    });
}

// Функция сохранения дублированной тренировки
function saveDuplicatedWorkout(originalWorkoutId) {
    const workouts = JSON.parse(localStorage.getItem('workouts') || '[]');
    const originalWorkout = workouts.find(w => w.id === originalWorkoutId);
    
    if (!originalWorkout) return;

    const name = document.getElementById('duplicate-workout-name').value;
    const date = document.getElementById('duplicate-workout-date').value;
    const time = document.getElementById('duplicate-workout-time').value;
    const notes = document.getElementById('duplicate-workout-notes').value;

    if (!name || !date || !time) {
        alert('Пожалуйста, заполните все обязательные поля');
        return;
    }

    // Создаем новую тренировку на основе оригинальной
    const newWorkout = {
        id: Date.now().toString(),
        name: name,
        type: originalWorkout.type,
        date: date,
        time: time,
        notes: notes,
        exercises: JSON.parse(JSON.stringify(originalWorkout.exercises)),
        completed: false,
        deleted: false
    };

    // Добавляем новую тренировку
    workouts.push(newWorkout);
    localStorage.setItem('workouts', JSON.stringify(workouts));

    // Закрываем модальное окно
    const modal = bootstrap.Modal.getInstance(document.getElementById('duplicateWorkoutModal'));
    modal.hide();

    // Обновляем отображение
    loadWorkouts();
}

function allowDrop(ev) {
    ev.preventDefault();
}

function drag(ev) {
    ev.dataTransfer.setData("text", ev.target.id);
}

function drop(ev) {
    ev.preventDefault();
    const data = ev.dataTransfer.getData("text");
    const draggedElement = document.getElementById(data);
    const dropZone = ev.target.closest('.list-group');
    const dropTarget = ev.target.closest('.list-group-item');

    if (!dropZone || !draggedElement) return;

    if (dropTarget && dropTarget !== draggedElement) {
        const rect = dropTarget.getBoundingClientRect();
        const midpoint = rect.top + rect.height / 2;
        
        if (ev.clientY < midpoint) {
            dropTarget.parentNode.insertBefore(draggedElement, dropTarget);
        } else {
            dropTarget.parentNode.insertBefore(draggedElement, dropTarget.nextSibling);
        }
    } else {
        dropZone.appendChild(draggedElement);
    }
    
    updateExercisesOrder();
}

function updateExercisesOrder() {
    const isEditMode = document.getElementById('editExerciseList').children.length > 0;
    const listElement = isEditMode ? document.getElementById('editExerciseList') : document.getElementById('exerciseList');
    const exercises = [];
    
    Array.from(listElement.children).forEach((item, index) => {
        const exerciseId = item.getAttribute('data-exercise-id');
        const exerciseData = JSON.parse(item.getAttribute('data-exercise'));
        exercises.push(exerciseData);
    });

    if (isEditMode) {
        currentEditWorkout.exercises = exercises;
    } else {
        currentWorkout.exercises = exercises;
    }
}

function createExerciseElement(exercise, index, isEdit = false) {
    const listItem = document.createElement('div');
    listItem.className = 'list-group-item d-flex justify-content-between align-items-center';
    listItem.id = `exercise-${isEdit ? 'edit-' : ''}${index}`;
    listItem.draggable = true;
    listItem.ondragstart = drag;
    listItem.setAttribute('data-exercise-id', index);
    listItem.setAttribute('data-exercise', JSON.stringify(exercise));

    // Остальной код создания элемента упражнения остается без изменений
    // ... existing code ...

    return listItem;
}

function displayExercises(exercises, targetElement) {
    const listElement = document.getElementById(targetElement);
    listElement.innerHTML = '';
    
    exercises.forEach((exercise, index) => {
        const isEdit = targetElement === 'editExerciseList';
        const exerciseElement = createExerciseElement(exercise, index, isEdit);
        listElement.appendChild(exerciseElement);
    });
}

function dragEdit(event) {
    event.dataTransfer.setData("text", event.target.getAttribute('data-exercise-id'));
}

function allowDropEdit(event) {
    event.preventDefault();
}

function dropEdit(event) {
    event.preventDefault();
    const workoutId = document.getElementById('editWorkoutModal').getAttribute('data-workout-id');
    const workouts = JSON.parse(localStorage.getItem('workouts')) || [];
    const workoutIndex = workouts.findIndex(w => w.id === workoutId);
    
    if (workoutIndex === -1) return;

    const sourceIndex = parseInt(event.dataTransfer.getData("text"));
    const targetElement = event.target.closest('.exercise-item');
    
    if (!targetElement) return;
    
    const targetIndex = parseInt(targetElement.getAttribute('data-exercise-id'));
    
    if (isNaN(sourceIndex) || isNaN(targetIndex) || sourceIndex === targetIndex) return;

    // Переупорядочиваем упражнения
    const exercises = workouts[workoutIndex].exercises;
    const [movedExercise] = exercises.splice(sourceIndex, 1);
    exercises.splice(targetIndex, 0, movedExercise);

    // Сохраняем изменения
    localStorage.setItem('workouts', JSON.stringify(workouts));

    // Обновляем отображение
    const container = document.getElementById('edit-exercises-container');
    updateEditExercisesContainer(exercises, container, workoutId);
}

function updateEditExercisesContainer(exercises, container, workoutId) {
    container.innerHTML = '';
    exercises.forEach((exercise, index) => {
        const exerciseElement = document.createElement('div');
        exerciseElement.className = 'exercise-item mb-2 p-2 border rounded';
        exerciseElement.setAttribute('draggable', 'true');
        exerciseElement.setAttribute('ondragstart', 'dragEdit(event)');
        exerciseElement.setAttribute('ondragover', 'allowDropEdit(event)');
        exerciseElement.setAttribute('ondrop', 'dropEdit(event)');
        exerciseElement.setAttribute('data-exercise-id', index);
        exerciseElement.setAttribute('data-exercise', JSON.stringify(exercise));

        exerciseElement.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <h6 class="mb-0">${exercise.name}</h6>
                    <small class="text-muted">
                        ${exercise.type === 'reps' ? 
                            `${exercise.sets} подходов × ${exercise.reps} повторений ${exercise.weight ? `• ${exercise.weight} кг` : ''}` : 
                            `${exercise.duration} минут`}
                    </small>
                </div>
                <div>
                    <button type="button" class="btn btn-sm btn-outline-primary me-2" onclick="editExerciseInWorkout(${index})">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button type="button" class="btn btn-sm btn-outline-danger" onclick="removeExerciseFromEdit(${index}, '${workoutId}')">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>
        `;
        container.appendChild(exerciseElement);
    });
}

// Функция подсветки поля выбора типа тренировки
function highlightWorkoutType(highlight = true) {
    const typeSelect = document.getElementById('edit-workout-type');
    if (highlight) {
        typeSelect.style.transition = 'background-color 0.3s ease';
        typeSelect.style.backgroundColor = '#fff3cd';
        typeSelect.style.boxShadow = '0 0 0 0.25rem rgba(255, 193, 7, 0.25)';
        typeSelect.focus();
        
        // Добавляем обработчик для снятия подсветки при клике
        typeSelect.addEventListener('mousedown', function removeHighlight() {
            highlightWorkoutType(false);
            typeSelect.removeEventListener('mousedown', removeHighlight);
        });
    } else {
        typeSelect.style.backgroundColor = '';
        typeSelect.style.boxShadow = '';
    }
}

// Добавляем обработчик изменения типа тренировки
document.addEventListener('DOMContentLoaded', () => {
    const typeSelect = document.getElementById('edit-workout-type');
    if (typeSelect) {
        typeSelect.addEventListener('change', function() {
            if (this.value !== 'выбрать') {
                highlightWorkoutType(false);
            }
        });
    }
});

// Сохранение изменений тренировки
function saveWorkoutChanges() {
    const workoutId = document.getElementById('editWorkoutModal').getAttribute('data-workout-id');
    if (!workoutId) {
        showNotification('Ошибка: ID тренировки не найден', 'error');
        return;
    }

    const workoutIndex = workouts.findIndex(w => w.id === workoutId);
    if (workoutIndex === -1) {
        showNotification('Ошибка: тренировка не найдена', 'error');
        return;
    }

    const workout = workouts[workoutIndex];
    const newType = document.getElementById('edit-workout-type').value;

    // Проверяем, не выбран ли тип "выбрать"
    if (newType === 'выбрать') {
        highlightWorkoutType(true);
        showNotification('Пожалуйста, выберите тип тренировки', 'warning');
        return;
    }

    // Если тип тренировки изменился, очищаем упражнения
    if (newType !== workout.type) {
        workout.exercises = [];
    }

    // Убираем подсветку
    highlightWorkoutType(false);

    // Обновляем данные тренировки
    workout.name = document.getElementById('edit-workout-name').value;
    workout.type = newType;
    workout.date = document.getElementById('edit-workout-date').value;
    workout.time = document.getElementById('edit-workout-time').value;
    workout.notes = document.getElementById('edit-workout-notes').value;

    // Обновляем упражнения в тренировке
    if (!workout.exercises) {
        workout.exercises = [];
    }
    
    // Получаем все упражнения из контейнера
    const exerciseContainer = document.getElementById('edit-exercises-container');
    const exerciseElements = exerciseContainer.getElementsByClassName('exercise-item');
    workout.exercises = Array.from(exerciseElements).map(element => {
        return JSON.parse(element.getAttribute('data-exercise'));
    });

    // Сохраняем изменения в localStorage
    localStorage.setItem('workouts', JSON.stringify(workouts));

    // Закрываем модальное окно
    const modal = bootstrap.Modal.getInstance(document.getElementById('editWorkoutModal'));
    modal.hide();

    // Обновляем отображение тренировок
    loadWorkouts();

    // Показываем уведомление
    showNotification('Тренировка успешно обновлена', 'success');
}

// Удаление упражнения при редактировании
function removeExerciseFromEdit(index, workoutId) {
    if (!confirm('Вы уверены, что хотите удалить это упражнение?')) {
        return;
    }

    const workouts = JSON.parse(localStorage.getItem('workouts')) || [];
    const workoutIndex = workouts.findIndex(w => w.id === workoutId);
    
    if (workoutIndex !== -1) {
        workouts[workoutIndex].exercises.splice(index, 1);
        localStorage.setItem('workouts', JSON.stringify(workouts));
        
        // Обновляем отображение упражнений
        const container = document.getElementById('edit-exercises-container');
        updateEditExercisesContainer(workouts[workoutIndex].exercises, container, workoutId);
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