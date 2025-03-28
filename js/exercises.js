// Хранение данных
let exercises = JSON.parse(localStorage.getItem('exercises')) || [];
let isSelectionMode = false;
let selectedExercises = new Set();

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    setupForm();
    loadExercises();
    initializeSearch();
    setupSelectionMode();
});

// Настройка формы
function setupForm() {
    const form = document.getElementById('exercise-form');
    const categoriesContainer = document.createElement('div');
    categoriesContainer.id = 'categories-container';

    // Создаем первую строку категории
    const firstCategoryRow = createCategoryRow(0);
    categoriesContainer.appendChild(firstCategoryRow);

    // Находим место для вставки категорий (после label "Категория")
    const categoryLabel = document.querySelector('label[for="exercise-category"]');
    categoryLabel.parentNode.replaceChild(categoriesContainer, document.getElementById('exercise-category'));

    // Обработчик отправки формы
    form.addEventListener('submit', createExercise);
}

// Создание строки с категорией
function createCategoryRow(index) {
    const row = document.createElement('div');
    row.className = 'd-flex align-items-center mb-2';
    row.dataset.index = index;

    const select = document.createElement('select');
    select.className = 'form-select me-2';
    select.style.width = 'auto';
    select.id = `exercise-category-${index}`;
    select.required = true;

    const categories = getCategories();
    select.innerHTML = '<option value="">Выберите категорию</option>';
    categories.forEach(category => {
        select.innerHTML += `<option value="${category}">${category}</option>`;
    });

    const addButton = document.createElement('button');
    addButton.type = 'button';
    addButton.className = 'btn btn-outline-primary btn-sm ms-2';
    addButton.innerHTML = '<i class="bi bi-plus"></i>';
    addButton.onclick = addCategoryRow;

    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'btn btn-outline-danger btn-sm ms-2';
    removeButton.innerHTML = '<i class="bi bi-dash"></i>';
    removeButton.onclick = () => removeCategoryRow(row);
    removeButton.style.display = index === 0 ? 'none' : 'block';

    const customInput = document.createElement('input');
    customInput.type = 'text';
    customInput.className = 'form-control';
    customInput.id = `custom-category-${index}`;
    customInput.placeholder = 'Введите свою категорию';
    customInput.style.display = 'none';
    customInput.style.width = 'auto';

    select.addEventListener('change', function() {
        customInput.style.display = this.value === 'Другое' ? 'block' : 'none';
    });

    row.appendChild(select);
    row.appendChild(customInput);
    row.appendChild(addButton);
    row.appendChild(removeButton);

    return row;
}

// Добавление новой строки категории
function addCategoryRow() {
    const container = document.getElementById('categories-container');
    const index = container.children.length;
    const newRow = createCategoryRow(index);
    container.appendChild(newRow);
}

// Удаление строки категории
function removeCategoryRow(row) {
    row.remove();
}

// Инициализация поиска
function initializeSearch() {
    const searchInput = document.getElementById('exercise-search');

    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filteredExercises = exercises.filter(exercise => {
            const nameMatch = exercise.name.toLowerCase().includes(searchTerm);
            const categoriesMatch = exercise.categories ?
                exercise.categories.some(cat => cat.toLowerCase().includes(searchTerm)) :
                exercise.category.toLowerCase().includes(searchTerm);
            return nameMatch || categoriesMatch;
        });
        displayExercises(filteredExercises);
    });
}

// Загрузка упражнений
function loadExercises() {
    displayExercises(exercises);
}

// Настройка режима выбора
function setupSelectionMode() {
    const selectBtn = document.getElementById('select-exercises-btn');
    const deleteBtn = document.getElementById('delete-selected-exercises-btn');

    selectBtn.addEventListener('click', () => {
        isSelectionMode = !isSelectionMode;
        selectedExercises.clear();

        if (isSelectionMode) {
            selectBtn.classList.add('active');
            deleteBtn.style.display = 'inline-block';
            document.querySelectorAll('.exercise-item').forEach(item => {
                item.classList.add('selectable');
                item.addEventListener('click', handleExerciseClick);
            });
        } else {
            selectBtn.classList.remove('active');
            deleteBtn.style.display = 'none';
            document.querySelectorAll('.exercise-item').forEach(item => {
                item.classList.remove('selectable', 'selected');
                item.removeEventListener('click', handleExerciseClick);
            });
        }
    });

    deleteBtn.addEventListener('click', () => {
        if (selectedExercises.size === 0) {
            showNotification('Выберите упражнения для удаления', 'warning');
            return;
        }

        if (confirm(`Вы уверены, что хотите удалить ${selectedExercises.size} упражнений?`)) {
            deleteSelectedExercises();
        }
    });
}

// Обработчик клика по упражнению
function handleExerciseClick(event) {
    event.preventDefault();
    event.stopPropagation();

    const item = event.currentTarget;

    if (!item.classList.contains('exercise-item')) {
        return;
    }

    toggleExerciseSelection(item);
}

// Переключение выбора упражнения
function toggleExerciseSelection(item) {
    const exerciseId = item.dataset.exerciseId;
    if (!exerciseId) return;

    if (selectedExercises.has(exerciseId)) {
        selectedExercises.delete(exerciseId);
        item.classList.remove('selected');
    } else {
        selectedExercises.add(exerciseId);
        item.classList.add('selected');
    }
}

// Удаление выбранных упражнений
function deleteSelectedExercises() {
    exercises = exercises.filter(exercise => !selectedExercises.has(exercise.id.toString()));
    localStorage.setItem('exercises', JSON.stringify(exercises));
    selectedExercises.clear();
    isSelectionMode = false;

    document.getElementById('select-exercises-btn').classList.remove('active');
    document.getElementById('delete-selected-exercises-btn').style.display = 'none';

    showNotification('Выбранные упражнения удалены', 'success');
    loadExercises();
}

// Отображение упражнений
function displayExercises(exercisesToShow) {
    const container = document.getElementById('exercises-list');
    container.innerHTML = '';

    if (exercisesToShow.length === 0) {
        container.innerHTML = '<p class="text-muted">Нет упражнений</p>';
        return;
    }

    // Сортируем упражнения по дате добавления (новые сверху)
    exercisesToShow.sort((a, b) => new Date(b.date) - new Date(a.date));

    exercisesToShow.forEach(exercise => {
                const exerciseElement = document.createElement('div');
                exerciseElement.className = 'exercise-item mb-3 p-3 border rounded';
                exerciseElement.dataset.exerciseId = exercise.id;
                exerciseElement.innerHTML = `
            <div class="d-flex justify-content-between align-items-start">
                <div>
                    <h5 class="mb-1">${exercise.name}</h5>
                    <p class="mb-1">Тип: ${exercise.type}</p>
                    <p class="mb-1">Категория: ${exercise.categories ? exercise.categories.join(' + ') : exercise.category}</p>
                    ${exercise.notes ? `<p class="mb-1 text-muted">${exercise.notes}</p>` : ''}
                    <small class="text-muted">Добавлено: ${new Date(exercise.date).toLocaleDateString('ru-RU')}</small>
                </div>
            </div>
        `;
        container.appendChild(exerciseElement);
    });
}

// Получение названия категории
function getCategoryName(category) {
    const categories = {
        chest: 'Грудь',
        back: 'Спина',
        legs: 'Ноги',
        shoulders: 'Плечи',
        arms: 'Руки',
        core: 'Пресс',
        cardio: 'Кардио'
    };
    return categories[category] || category;
}

// Удаление упражнения
function deleteExercise(id) {
    if (confirm('Вы уверены, что хотите удалить это упражнение?')) {
        exercises = exercises.filter(exercise => exercise.id !== id);
        saveExercises();
        loadExercises();
    }
}

// Сохранение данных
function saveExercises() {
    localStorage.setItem('exercises', JSON.stringify(exercises));
}

function getCategories() {
    return [
        'Грудь',
        'Спина',
        'Ноги',
        'Плечи',
        'Бицепс',
        'Трицепс',
        'Пресс',
        'Кардио',
        'Растяжка',
        'Другое'
    ];
}

// Создание нового упражнения
function createExercise(event) {
    event.preventDefault();

    const name = document.getElementById('exercise-name').value;
    const exerciseType = document.getElementById('exercise-type').value;
    const notes = document.getElementById('exercise-notes').value;
    
    if (!name || !exerciseType) {
        alert('Пожалуйста, заполните обязательные поля');
        return;
    }

    // Собираем все выбранные категории
    const categories = [];
    const categoryRows = document.querySelectorAll('#categories-container > div');
    
    categoryRows.forEach(row => {
        const index = row.dataset.index;
        const select = document.getElementById(`exercise-category-${index}`);
        let category = select.value;

        if (category) {
            if (category === 'Другое') {
                const customInput = document.getElementById(`custom-category-${index}`);
                if (customInput.value) {
                    category = customInput.value;
                } else {
                    return;
                }
            }
            categories.push(category);
        }
    });

    if (categories.length === 0) {
        alert('Пожалуйста, выберите хотя бы одну категорию');
        return;
    }

    const exercise = {
        id: Date.now(),
        name: name,
        type: exerciseType,
        categories: categories,
        notes: notes,
        date: new Date().toISOString()
    };

    exercises.push(exercise);
    saveExercises();
    loadExercises();

    // Очищаем форму
    event.target.reset();
    // Оставляем только первую строку категории
    const container = document.getElementById('categories-container');
    while (container.children.length > 1) {
        container.lastChild.remove();
    }
    // Сбрасываем первую строку
    const firstSelect = document.getElementById('exercise-category-0');
    firstSelect.value = '';
    document.getElementById('custom-category-0').style.display = 'none';
}