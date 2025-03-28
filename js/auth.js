document.addEventListener('DOMContentLoaded', function() {
    // Проверяем, авторизован ли пользователь
    checkAuth();

    // Обработка формы входа только на странице логина
    if (window.location.pathname.includes('login.html')) {
        const form = document.getElementById('login-form');
        if (form) {
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                login();
            });
        }
    }
});

function checkAuth() {
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser && window.location.pathname.includes('login.html')) {
        window.location.href = 'index.html';
    } else if (!currentUser && !window.location.pathname.includes('login.html')) {
        window.location.href = 'login.html';
    }
}

function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
        window.location.href = 'index.html';
    } else {
        showNotification('Неверное имя пользователя или пароль', 'error');
    }
}

function register() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    if (password !== confirmPassword) {
        showNotification('Пароли не совпадают', 'error');
        return;
    }

    const users = JSON.parse(localStorage.getItem('users') || '[]');

    if (users.some(u => u.username === username)) {
        showNotification('Пользователь с таким именем уже существует', 'error');
        return;
    }

    const newUser = {
        id: Date.now().toString(),
        username,
        password,
        createdAt: new Date().toISOString()
    };

    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('currentUser', JSON.stringify(newUser));

    showNotification('Регистрация успешна', 'success');
    window.location.href = 'index.html';
}

function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'login.html';
}

function showRegisterForm() {
    const form = document.getElementById('login-form');
    form.innerHTML = `
        <div class="mb-3">
            <label for="username" class="form-label">Имя пользователя</label>
            <input type="text" class="form-control" id="username" required>
        </div>
        <div class="mb-3">
            <label for="password" class="form-label">Пароль</label>
            <input type="password" class="form-control" id="password" required>
        </div>
        <div class="mb-3">
            <label for="confirm-password" class="form-label">Подтвердите пароль</label>
            <input type="password" class="form-control" id="confirm-password" required>
        </div>
        <div class="d-grid gap-2">
            <button type="button" class="btn btn-primary" onclick="register()">Зарегистрироваться</button>
            <button type="button" class="btn btn-secondary" onclick="showLoginForm()">Вернуться к входу</button>
        </div>
    `;
}

function showLoginForm() {
    const form = document.getElementById('login-form');
    form.innerHTML = `
        <div class="mb-3">
            <label for="username" class="form-label">Имя пользователя</label>
            <input type="text" class="form-control" id="username" required>
        </div>
        <div class="mb-3">
            <label for="password" class="form-label">Пароль</label>
            <input type="password" class="form-control" id="password" required>
        </div>
        <div class="d-grid gap-2">
            <button type="submit" class="btn btn-primary">Войти</button>
            <button type="button" class="btn btn-secondary" onclick="showRegisterForm()">Зарегистрироваться</button>
        </div>
    `;
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} position-fixed top-0 end-0 m-3`;
    notification.style.zIndex = '1000';
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}