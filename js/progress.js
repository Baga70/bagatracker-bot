// Хранение данных
let workouts = JSON.parse(localStorage.getItem('workouts')) || [];
let exercises = JSON.parse(localStorage.getItem('exercises')) || [];

let chart = null;

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    setupProgressForm();
    loadExercises();
});

function setupProgressForm() {
    const exerciseSelect = document.getElementById('exercise-select');
    const daysInput = document.getElementById('days-input');
    const metricSelect = document.getElementById('metric-select');
    const workoutTypeSelect = document.getElementById('workout-type-select');

    if (exerciseSelect && daysInput && metricSelect && workoutTypeSelect) {
        exerciseSelect.addEventListener('change', updateChart);
        daysInput.addEventListener('input', updateChart);
        metricSelect.addEventListener('change', updateChart);
        workoutTypeSelect.addEventListener('change', loadExercises);
    }
}

function loadExercises() {
    const exercises = JSON.parse(localStorage.getItem('exercises') || '[]');
    const exerciseSelect = document.getElementById('exercise-select');
    const workoutTypeSelect = document.getElementById('workout-type-select');
    const selectedWorkoutType = workoutTypeSelect.value;

    if (!exerciseSelect) return;

    exerciseSelect.innerHTML = '<option value="">Выберите упражнение</option>';
    const uniqueExercises = new Set();

    // Получаем все завершенные тренировки
    const workouts = JSON.parse(localStorage.getItem('workouts') || '[]')
        .filter(w => w.completed && !w.deleted);

    // Фильтруем тренировки по выбранному типу
    const filteredWorkouts = selectedWorkoutType ?
        workouts.filter(w => w.type === selectedWorkoutType) :
        workouts;

    // Собираем уникальные упражнения из отфильтрованных тренировок
    filteredWorkouts.forEach(workout => {
        workout.exercises.forEach(exercise => {
            // Проверяем, что упражнение существует в списке упражнений
            const exerciseExists = exercises.some(e => e.id === exercise.id);
            if (exerciseExists) {
                uniqueExercises.add(JSON.stringify({
                    id: exercise.id,
                    name: exercise.name,
                    type: exercise.type
                }));
            }
        });
    });

    // Добавляем упражнения в select
    Array.from(uniqueExercises)
        .map(exercise => JSON.parse(exercise))
        .sort((a, b) => a.name.localeCompare(b.name))
        .forEach(exercise => {
            exerciseSelect.innerHTML += `<option value="${exercise.id}" data-type="${exercise.type}">${exercise.name}</option>`;
        });

    // Сбрасываем график при изменении типа тренировки
    updateChart();
}

function updateChart() {
    const exerciseSelect = document.getElementById('exercise-select');
    const selectedOption = exerciseSelect.options[exerciseSelect.selectedIndex];
    const exerciseId = exerciseSelect.value;
    const exerciseType = selectedOption ? selectedOption.dataset.type : null;
    const days = parseInt(document.getElementById('days-input').value);
    const metricType = document.getElementById('metric-select').value;
    const workoutTypeSelect = document.getElementById('workout-type-select');
    const selectedWorkoutType = workoutTypeSelect.value;

    if (!exerciseId || !exerciseType || isNaN(days) || days < 1 || days > 365) {
        return;
    }

    // Получаем все завершенные тренировки
    const workouts = JSON.parse(localStorage.getItem('workouts') || '[]')
        .filter(w => w.completed && !w.deleted);

    // Фильтруем тренировки по выбранному типу
    const typeFilteredWorkouts = selectedWorkoutType ?
        workouts.filter(w => w.type === selectedWorkoutType) :
        workouts;

    // Сортируем по дате тренировки
    typeFilteredWorkouts.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Фильтруем тренировки за указанный период
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const filteredWorkouts = typeFilteredWorkouts.filter(workout => {
        const workoutDate = new Date(workout.date);
        return workoutDate >= startDate && workoutDate <= endDate;
    });

    // Собираем данные по выбранному упражнению
    const data = [];
    const labels = [];

    filteredWorkouts.forEach(workout => {
        workout.exercises.forEach(exercise => {
            if (exercise.id === parseInt(exerciseId)) {
                let value = 0;
                if (metricType === 'weight' && exercise.type === 'reps') {
                    value = exercise.weight || 0;
                } else if (metricType === 'reps' && exercise.type === 'reps') {
                    value = exercise.reps * exercise.sets;
                } else if (metricType === 'duration' && exercise.type === 'time') {
                    value = exercise.duration;
                }

                if (value > 0) {
                    data.push(value);
                    labels.push(new Date(workout.date).toLocaleDateString('ru-RU'));
                }
            }
        });
    });

    // Если данных нет, показываем сообщение
    const chartContainer = document.getElementById('chart-container');
    const noDataMessage = document.getElementById('no-data-message');

    if (data.length === 0) {
        if (chartContainer) chartContainer.style.display = 'none';
        if (noDataMessage) noDataMessage.style.display = 'block';
        return;
    }

    if (chartContainer) chartContainer.style.display = 'block';
    if (noDataMessage) noDataMessage.style.display = 'none';

    // Создаем или обновляем график
    const ctx = document.getElementById('progress-chart').getContext('2d');

    if (chart) {
        chart.destroy();
    }

    const exerciseName = selectedOption ? selectedOption.text : '';

    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: getMetricLabel(metricType),
                data: data,
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: `Прогресс: ${exerciseName}`
                }
            }
        }
    });
}

function getMetricLabel(metricType) {
    switch (metricType) {
        case 'weight':
            return 'Вес (кг)';
        case 'reps':
            return 'Количество повторений';
        case 'duration':
            return 'Длительность (мин)';
        default:
            return 'Значение';
    }
}