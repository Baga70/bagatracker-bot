// Определение достижений и их условий
const achievements = {
    'first-workout': {
        name: 'Первые шаги',
        condition: (stats) => stats.totalWorkouts >= 1,
        progress: (stats) => Math.min(stats.totalWorkouts / 1 * 100, 100)
    },
    'regular-workout': {
        name: 'На верном пути',
        condition: (stats) => stats.totalWorkouts >= 5,
        progress: (stats) => Math.min(stats.totalWorkouts / 5 * 100, 100)
    },
    'consistent-workout': {
        name: 'Постоянство',
        condition: (stats) => stats.totalWorkouts >= 20,
        progress: (stats) => Math.min(stats.totalWorkouts / 20 * 100, 100)
    },
    'master-discipline': {
        name: 'Мастер дисциплины',
        condition: (stats) => stats.totalWorkouts >= 100,
        progress: (stats) => Math.min(stats.totalWorkouts / 100 * 100, 100)
    },
    'explorer': {
        name: 'Исследователь',
        condition: (stats) => stats.uniqueWorkoutTypes.size >= 3,
        progress: (stats) => Math.min(stats.uniqueWorkoutTypes.size / 3 * 100, 100)
    },
    'силовая-мастер': {
        title: 'Мастер силовых тренировок',
        description: 'Выполните 10 силовых тренировок',
        condition: (stats) => stats.workoutTypeCount['силовая'] >= 10,
        progress: (stats) => Math.min(stats.workoutTypeCount['силовая'] / 10 * 100, 100)
    },
    'кардио-король': {
        title: 'Король кардио',
        description: 'Выполните 10 кардио тренировок',
        condition: (stats) => stats.workoutTypeCount['кардио'] >= 10,
        progress: (stats) => Math.min(stats.workoutTypeCount['кардио'] / 10 * 100, 100)
    },
    'растяжка-мастер': {
        title: 'Мастер растяжки',
        description: 'Выполните 10 тренировок на растяжку',
        condition: (stats) => stats.workoutTypeCount['растяжка'] >= 10,
        progress: (stats) => Math.min(stats.workoutTypeCount['растяжка'] / 10 * 100, 100)
    },
    'силовая-прогресс': {
        title: 'Прогресс в силовых тренировках',
        description: 'Увеличьте вес в силовых упражнениях на 20%',
        condition: (stats) => stats.strengthProgress >= 20,
        progress: (stats) => Math.min(stats.strengthProgress, 20)
    },
    'endurance': {
        name: 'Выносливость',
        condition: (stats) => stats.maxDurationIncrease >= 100,
        progress: (stats) => Math.min(stats.maxDurationIncrease / 100 * 100, 100)
    },
    'weekly-marathon': {
        name: 'Недельный марафон',
        condition: (stats) => stats.consecutiveDays >= 7,
        progress: (stats) => Math.min(stats.consecutiveDays / 7 * 100, 100)
    },
    'iron-will': {
        name: 'Железная воля',
        condition: (stats) => stats.consecutiveDays >= 30,
        progress: (stats) => Math.min(stats.consecutiveDays / 30 * 100, 100)
    }
};

// Инициализация статистики
let stats = {
    totalWorkouts: 0,
    totalDuration: 0,
    workoutTypeCount: {
        'силовая': 0,
        'кардио': 0,
        'растяжка': 0
    },
    exerciseCount: {},
    maxWeight: {},
    maxDuration: {},
    strengthProgress: 0,
    uniqueWorkoutTypes: new Set(),
    maxWeightIncrease: 0,
    maxDurationIncrease: 0,
    consecutiveDays: 0,
    unlockedAchievements: new Set()
};

// Функция для построения статистики из истории тренировок
function buildStatsFromHistory() {
    const workouts = JSON.parse(localStorage.getItem('workouts') || '[]');

    // Сброс статистики
    stats = {
        totalWorkouts: 0,
        totalDuration: 0,
        workoutTypeCount: {
            'силовая': 0,
            'кардио': 0,
            'растяжка': 0
        },
        exerciseCount: {},
        maxWeight: {},
        maxDuration: {},
        strengthProgress: 0,
        uniqueWorkoutTypes: new Set(),
        maxWeightIncrease: 0,
        maxDurationIncrease: 0,
        consecutiveDays: 0,
        unlockedAchievements: new Set()
    };

    if (workouts.length === 0) {
        updateUI();
        return;
    }

    // Сортируем тренировки по дате
    workouts.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Отслеживание максимальных весов для каждого упражнения
    const exerciseMaxWeights = new Map();
    // Отслеживание максимальной длительности для каждого упражнения
    const exerciseMaxDuration = {};

    // Обработка каждой тренировки
    workouts.forEach(workout => {
        if (!workout.completed) return; // Пропускаем незавершенные тренировки

        // Увеличиваем общее количество тренировок
        stats.totalWorkouts++;
        stats.totalDuration += workout.duration || 0;

        // Добавляем тип тренировки в уникальные и увеличиваем счётчик
        if (workout.type) {
            stats.uniqueWorkoutTypes.add(workout.type);

            // Подсчет тренировок по типам
            switch (workout.type.toLowerCase()) {
                case 'силовая':
                    stats.workoutTypeCount['силовая']++;
                    break;
                case 'кардио':
                    stats.workoutTypeCount['кардио']++;
                    break;
                case 'растяжка':
                    stats.workoutTypeCount['растяжка']++;
                    break;
            }
        }

        // Проверяем прогресс в упражнениях
        if (workout.exercises) {
            workout.exercises.forEach(exercise => {
                // Проверяем прогресс в весе
                if (exercise.weight) {
                    const prevMax = exerciseMaxWeights.get(exercise.name) || 0;
                    if (exercise.weight > prevMax) {
                        if (prevMax > 0) {
                            const increase = ((exercise.weight - prevMax) / prevMax) * 100;
                            stats.maxWeightIncrease = Math.max(
                                stats.maxWeightIncrease,
                                increase
                            );
                        }
                        exerciseMaxWeights.set(exercise.name, exercise.weight);
                    }
                }

                // Проверяем прогресс в длительности
                if (exercise.type === 'time' && exercise.duration) {
                    const duration = parseInt(exercise.duration) || 0;
                    const prevDuration = exerciseMaxDuration[exercise.name] || 0;

                    if (prevDuration > 0 && duration >= prevDuration * 2) {
                        // Если длительность увеличилась в 2 или более раз
                        stats.maxDurationIncrease = 100;
                    }
                    exerciseMaxDuration[exercise.name] = Math.max(prevDuration, duration);
                }
            });
        }
    });

    // Вычисляем максимальное количество последовательных дней
    const dates = workouts
        .filter(w => w.completed)
        .map(w => new Date(w.date).toDateString());
    dates.sort();

    let consecutiveDays = 1;
    let maxConsecutiveDays = 1;
    let previousDate = new Date(dates[0]);

    for (let i = 1; i < dates.length; i++) {
        const currentDate = new Date(dates[i]);
        const diffDays = Math.round((currentDate - previousDate) / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
            consecutiveDays++;
            maxConsecutiveDays = Math.max(maxConsecutiveDays, consecutiveDays);
        } else if (diffDays > 1) {
            consecutiveDays = 1;
        }

        previousDate = currentDate;
    }

    stats.consecutiveDays = maxConsecutiveDays;

    // Проверяем достижения
    checkAchievements();
}

// Проверка достижений
function checkAchievements() {
    for (const [id, achievement] of Object.entries(achievements)) {
        if (achievement.condition(stats)) {
            stats.unlockedAchievements.add(id);
        }
    }
    updateUI();
}

// Обновление UI
function updateUI() {
    // Обновляем уровень
    const level = stats.unlockedAchievements.size + 1;
    document.getElementById('userLevel').textContent = level;

    // Обновляем прогресс-бар уровня
    const totalAchievements = Object.keys(achievements).length;
    const progress = (stats.unlockedAchievements.size / totalAchievements) * 100;
    const levelProgress = document.getElementById('levelProgress');
    levelProgress.style.width = `${progress}%`;
    levelProgress.setAttribute('aria-valuenow', progress);

    // Обновляем отображение всех достижений
    for (const [id, achievement] of Object.entries(achievements)) {
        const card = document.getElementById(id);
        if (card) {
            if (stats.unlockedAchievements.has(id)) {
                card.classList.remove('achievement-locked');
                card.querySelector('.progress-bar').style.width = '100%';
                card.querySelector('.card-text').textContent = card.querySelector('.card-text').textContent.split('\n')[0];
            } else {
                card.classList.add('achievement-locked');
                const progress = achievement.progress(stats);
                card.querySelector('.progress-bar').style.width = `${progress}%`;
                const progressText = Math.round(progress);
                const baseText = card.querySelector('.card-text').textContent.split('\n')[0];
                card.querySelector('.card-text').innerHTML = `${baseText}<br><small class="text-muted">Прогресс: ${progressText}%</small>`;
            }
        }
    }

    document.getElementById('achievementsCount').textContent = stats.unlockedAchievements.size;
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    buildStatsFromHistory();
});

// Получение максимального веса для упражнения
function getMaxWeight(exerciseName) {
    const workouts = JSON.parse(localStorage.getItem('workouts') || '[]');
    let maxWeight = 0;

    workouts.forEach(workout => {
        if (workout.exercises) {
            workout.exercises.forEach(exercise => {
                if (exercise.name === exerciseName && exercise.weight > maxWeight) {
                    maxWeight = exercise.weight;
                }
            });
        }
    });

    return maxWeight;
}

// Получение максимальной длительности кардио
function getMaxDuration() {
    const workouts = JSON.parse(localStorage.getItem('workouts') || '[]');
    let maxDuration = 0;

    workouts.forEach(workout => {
        if (workout.type === 'cardio' && workout.duration > maxDuration) {
            maxDuration = workout.duration;
        }
    });

    return maxDuration;
}

// Обновление последовательных дней
function updateConsecutiveDays(workoutDate) {
    const workouts = JSON.parse(localStorage.getItem('workouts') || '[]');
    const dates = workouts.map(w => new Date(w.date).toDateString());
    dates.push(new Date(workoutDate).toDateString());
    dates.sort();

    let consecutiveDays = 1;
    let maxConsecutiveDays = 1;
    let previousDate = new Date(dates[0]);

    for (let i = 1; i < dates.length; i++) {
        const currentDate = new Date(dates[i]);
        const diffDays = Math.round((currentDate - previousDate) / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
            consecutiveDays++;
            maxConsecutiveDays = Math.max(maxConsecutiveDays, consecutiveDays);
        } else if (diffDays > 1) {
            consecutiveDays = 1;
        }

        previousDate = currentDate;
    }

    stats.consecutiveDays = maxConsecutiveDays;
}

function checkEnduranceProgress(workouts) {
    if (!workouts || workouts.length < 2) return 0;

    // Создаем словарь для отслеживания максимального времени каждого упражнения
    const exerciseMaxDuration = {};
    let hasIncreasedDuration = false;

    // Сортируем тренировки по дате (от старых к новым)
    const sortedWorkouts = [...workouts]
        .filter(w => w.completed)
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    // Проходим по всем тренировкам
    sortedWorkouts.forEach(workout => {
        if (!workout.exercises) return;

        workout.exercises.forEach(exercise => {
            // Проверяем оба типа: 'duration' и 'time'
            if (exercise.type === 'duration' || exercise.type === 'time') {
                const duration = parseInt(exercise.duration) || 0;

                if (!exerciseMaxDuration[exercise.name]) {
                    exerciseMaxDuration[exercise.name] = duration;
                } else {
                    const prevDuration = exerciseMaxDuration[exercise.name];
                    // Проверяем, увеличилось ли время в 2 или более раз
                    if (prevDuration > 0 && duration >= prevDuration * 2) {
                        hasIncreasedDuration = true;
                    }
                    // Обновляем максимальную длительность
                    exerciseMaxDuration[exercise.name] = Math.max(prevDuration, duration);
                }
            }
        });
    });

    return hasIncreasedDuration ? 100 : 0;
}

// Инициализация статистики
function initializeStats() {
    return {
        totalWorkouts: 0,
        totalDuration: 0,
        workoutTypeCount: {
            'силовая': 0,
            'кардио': 0,
            'растяжка': 0
        },
        exerciseCount: {},
        maxWeight: {},
        maxDuration: {},
        strengthProgress: 0
    };
}

// Обновление статистики
function updateStats(workout) {
    const stats = getStats();

    stats.totalWorkouts++;
    stats.totalDuration += workout.duration || 0;

    // Обновляем счетчик типов тренировок
    if (workout.type === 'силовая') {
        stats.workoutTypeCount['силовая']++;
    } else if (workout.type === 'кардио') {
        stats.workoutTypeCount['кардио']++;
    } else if (workout.type === 'растяжка') {
        stats.workoutTypeCount['растяжка']++;
    }

    // Проверяем прогресс в весе
    if (workout.exercises) {
        workout.exercises.forEach(exercise => {
            if (exercise.weight) {
                const prevMax = stats.maxWeight[exercise.name] || 0;
                if (exercise.weight > prevMax) {
                    if (prevMax > 0) {
                        const increase = ((exercise.weight - prevMax) / prevMax) * 100;
                        stats.maxWeightIncrease = Math.max(
                            stats.maxWeightIncrease,
                            increase
                        );
                    }
                    stats.maxWeight[exercise.name] = exercise.weight;
                }
            }
        });
    }

    // Проверяем прогресс в длительности
    if (workout.type === 'cardio' && workout.duration) {
        const duration = parseInt(workout.duration) || 0;
        const prevDuration = stats.maxDuration[workout.type] || 0;

        if (prevDuration > 0 && duration >= prevDuration * 2) {
            // Если длительность увеличилась в 2 или более раз
            stats.maxDurationIncrease = 100;
        }
        stats.maxDuration[workout.type] = Math.max(prevDuration, duration);
    }

    // Проверяем достижения
    checkAchievements();
}