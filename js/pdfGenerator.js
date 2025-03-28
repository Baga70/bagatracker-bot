// Класс для генерации PDF
class PDFGenerator {
    constructor() {
        this.scale = 1.5;
        this.pageWidth = 595;
        this.pageHeight = 842;
        this.margin = 30;
        this.lineHeight = 20;
    }

    // Инициализация canvas
    initCanvas() {
        const canvas = document.createElement('canvas');
        canvas.width = this.pageWidth * this.scale;
        canvas.height = this.pageHeight * this.scale;

        const ctx = canvas.getContext('2d');
        ctx.scale(this.scale, this.scale);

        // Устанавливаем белый фон
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'black';

        return { canvas, ctx };
    }

    // Форматирование даты
    formatDate(dateString) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('ru-RU', options);
    }

    // Получение типа тренировки
    getWorkoutType(type) {
        const types = {
            'силовая': 'Силовая',
            'кардио': 'Кардио',
            'растяжка': 'Растяжка'
        };
        return types[type.toLowerCase()] || type;
    }

    // Создание PDF для тренировки
    async createWorkoutPDF(workout) {
            try {
                const { canvas, ctx } = this.initCanvas();
                let yPos = this.margin;

                // Заголовок
                ctx.font = 'bold 20px Arial';
                ctx.fillText(`Тренировка: ${workout.name || 'Без названия'}`, this.margin, yPos);
                yPos += this.lineHeight * 1.5;

                // Информация о тренировке
                ctx.font = '14px Arial';
                ctx.fillText(`Тип: ${this.getWorkoutType(workout.type)}`, this.margin, yPos);
                yPos += this.lineHeight;
                ctx.fillText(`Дата: ${this.formatDate(workout.date)}`, this.margin, yPos);
                yPos += this.lineHeight;

                if (workout.time) {
                    ctx.fillText(`Время: ${workout.time}`, this.margin, yPos);
                    yPos += this.lineHeight;
                }

                // Упражнения
                yPos += this.lineHeight;
                ctx.font = 'bold 16px Arial';
                ctx.fillText('Упражнения:', this.margin, yPos);
                yPos += this.lineHeight;

                ctx.font = '14px Arial';
                if (workout.exercises && workout.exercises.length > 0) {
                    for (const exercise of workout.exercises) {
                        if (yPos > this.pageHeight - this.margin * 2) {
                            // Сохраняем текущую страницу
                            const pageImage = canvas.toDataURL('image/jpeg', 0.8);

                            // Очищаем canvas для новой страницы
                            ctx.fillStyle = 'white';
                            ctx.fillRect(0, 0, canvas.width, canvas.height);
                            ctx.fillStyle = 'black';
                            ctx.font = '14px Arial';
                            yPos = this.margin;
                        }

                        const exerciseText = exercise.type === 'reps' ?
                            `${exercise.name}: ${exercise.sets} × ${exercise.reps} ${exercise.weight ? `• ${exercise.weight}кг` : ''}` :
                        `${exercise.name}: ${exercise.duration} мин`;

                    ctx.fillText(exerciseText, this.margin, yPos);
                    yPos += this.lineHeight;
                }
            } else {
                ctx.fillText('Нет упражнений', this.margin, yPos);
                yPos += this.lineHeight;
            }

            // Заметки
            if (workout.notes) {
                if (yPos > this.pageHeight - this.margin * 4) {
                    // Очищаем canvas для новой страницы
                    ctx.fillStyle = 'white';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.fillStyle = 'black';
                    yPos = this.margin;
                }

                yPos += this.lineHeight;
                ctx.font = 'bold 16px Arial';
                ctx.fillText('Заметки:', this.margin, yPos);
                yPos += this.lineHeight;
                ctx.font = '14px Arial';
                ctx.fillText(workout.notes, this.margin, yPos);
            }

            // Создаем PDF
            const finalImg = canvas.toDataURL('image/jpeg', 0.8);
            window.jsPDF = window.jspdf.jsPDF;
            const doc = new jsPDF({
                compress: true,
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            doc.addImage(finalImg, 'JPEG', 0, 0, 210, 297);
            doc.save('workout.pdf');

            return true;
        } catch (error) {
            console.error('Ошибка при создании PDF:', error);
            throw error;
        }
    }

    // Создание PDF для списка упражнений
    async createExerciseListPDF(exercises) {
        try {
            const { canvas, ctx } = this.initCanvas();
            let yPos = this.margin;

            // Заголовок
            ctx.font = 'bold 20px Arial';
            ctx.fillText('Список упражнений', this.margin, yPos);
            yPos += this.lineHeight * 2;

            // Упражнения
            ctx.font = '14px Arial';
            if (exercises && exercises.length > 0) {
                for (const exercise of exercises) {
                    if (yPos > this.pageHeight - this.margin * 2) {
                        // Сохраняем текущую страницу
                        const pageImage = canvas.toDataURL('image/jpeg', 0.8);
                        
                        // Очищаем canvas для новой страницы
                        ctx.fillStyle = 'white';
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                        ctx.fillStyle = 'black';
                        ctx.font = '14px Arial';
                        yPos = this.margin;
                    }

                    ctx.font = 'bold 14px Arial';
                    ctx.fillText(exercise.name, this.margin, yPos);
                    yPos += this.lineHeight;

                    ctx.font = '14px Arial';
                    ctx.fillText(`Тип: ${this.getWorkoutType(exercise.type)}`, this.margin + 10, yPos);
                    yPos += this.lineHeight;

                    if (exercise.notes) {
                        ctx.fillText(`Заметки: ${exercise.notes}`, this.margin + 10, yPos);
                        yPos += this.lineHeight;
                    }

                    yPos += this.lineHeight / 2;
                }
            } else {
                ctx.fillText('Нет упражнений', this.margin, yPos);
            }

            // Создаем PDF
            const finalImg = canvas.toDataURL('image/jpeg', 0.8);
            window.jsPDF = window.jspdf.jsPDF;
            const doc = new jsPDF({
                compress: true,
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            doc.addImage(finalImg, 'JPEG', 0, 0, 210, 297);
            doc.save('exercises.pdf');

            return true;
        } catch (error) {
            console.error('Ошибка при создании PDF:', error);
            throw error;
        }
    }
}

// Создаем глобальный экземпляр генератора PDF
window.pdfGenerator = new PDFGenerator();