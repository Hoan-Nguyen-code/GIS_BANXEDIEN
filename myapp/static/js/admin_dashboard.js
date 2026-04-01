// ===== ADMIN DASHBOARD JS =====
document.addEventListener('DOMContentLoaded', function () {
    // Tự động ẩn alert messages sau 4 giây
    document.querySelectorAll('.alert').forEach(function (alert) {
        setTimeout(function () {
            alert.style.transition = 'opacity 0.5s ease';
            alert.style.opacity = '0';
            setTimeout(function () { alert.remove(); }, 500);
        }, 4000);
    });
});