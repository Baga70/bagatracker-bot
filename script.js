// Хранение данных
let workouts = JSON.parse(localStorage.getItem('workouts')) || [];
let exercises = JSON.parse(localStorage.getItem('exercises')) || [];
let settings = JSON.parse(localStorage.getItem('settings')) || {};

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    initializeForms();
    initializeProgressChart();
});

// Инициализация форм
function initializeForms() {
    // Форма плана тренировок
    document.getElementById('workout-plan-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const date = document.getElementById('workout-date').value;
        const type = document.getElementById('workout-type').value;

        const workout = {
            id: Date.now(),
            date,
            type,
            exercises: [],
            totalVolume: 0
        };

        workouts.push(workout);
        saveWorkouts();
        e.target.reset();
    });

    // Форма упражнений
    document.getElementById('exercise-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('exercise-name').value;
        const sets = parseInt(document.getElementById('exercise-sets').value);
        const reps = parseInt(document.getElementById('exercise-reps').value);
        const weight = parseFloat(document.getElementById('exercise-weight').value);

        const exercise = {
            id: Date.now(),
            name,
            sets,
            reps,
            weight,
            date: new Date().toISOString()
        };

        exercises.push(exercise);
        saveExercises();
        updateProgressChart();
        e.target.reset();
    });
}

// Сохранение данных
function saveWorkouts() {
    localStorage.setItem('workouts', JSON.stringify(workouts));
}

function saveExercises() {
    localStorage.setItem('exercises', JSON.stringify(exercises));
}

// Инициализация графика прогресса
function initializeProgressChart() {
    const ctx = document.getElementById('progress-chart').getContext('2d');
    window.progressChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Прогресс по весу',
                data: [],
                borderColor: '#0d6efd',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Обновление графика прогресса
function updateProgressChart() {
    const exerciseData = {};

    exercises.forEach(exercise => {
        if (!exerciseData[exercise.name]) {
            exerciseData[exercise.name] = [];
        }
        exerciseData[exercise.name].push({
            date: new Date(exercise.date),
            weight: exercise.weight
        });
    });

    // Обновляем график для первого упражнения (можно добавить выбор упражнения)
    const firstExercise = Object.keys(exerciseData)[0];
    if (firstExercise) {
        const data = exerciseData[firstExercise].sort((a, b) => a.date - b.date);
        window.progressChart.data.labels = data.map(d => d.date.toLocaleDateString());
        window.progressChart.data.datasets[0].data = data.map(d => d.weight);
        window.progressChart.update();
    }
}

// Удаление тренировки
function deleteWorkout(id) {
    workouts = workouts.filter(workout => workout.id !== id);
    saveWorkouts();
}