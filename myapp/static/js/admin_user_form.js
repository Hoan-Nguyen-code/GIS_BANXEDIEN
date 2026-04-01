// ===== ADMIN USER FORM JS =====

document.addEventListener('DOMContentLoaded', function () {

    // Tự động ẩn alert messages sau 4 giây
    document.querySelectorAll('.alert').forEach(function (alert) {
        setTimeout(function () {
            alert.style.transition = 'opacity 0.5s ease';
            alert.style.opacity = '0';
            setTimeout(function () { alert.remove(); }, 500);
        }, 4000);
    });

    // Validate form trước khi submit
    const form = document.querySelector('form');
    if (form) {
        form.addEventListener('submit', function (e) {
            const username = document.querySelector('input[name="username"]');
            const password = document.querySelector('input[name="password"]');
            const isAddMode = document.body.dataset.action === 'add';

            if (username && username.value.trim() === '') {
                e.preventDefault();
                alert('Username không được để trống!');
                username.focus();
                return;
            }

            if (isAddMode && password && password.value.trim() === '') {
                e.preventDefault();
                alert('Mật khẩu không được để trống!');
                password.focus();
                return;
            }
        });
    }

});