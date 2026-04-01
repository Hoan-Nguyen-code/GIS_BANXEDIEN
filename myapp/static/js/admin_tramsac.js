// ===== ADMIN TRAMSAC JS =====

document.addEventListener('DOMContentLoaded', function () {

    // Xử lý nút delete
    document.querySelectorAll('.btn-delete-station').forEach(function (btn) {
        btn.addEventListener('click', function () {
            const stationId = this.dataset.id;
            const stationName = this.dataset.name;
            const deleteUrl = this.dataset.url;

            if (confirm('Bạn có chắc muốn xóa trạm sạc "' + stationName + '"?\nHành động này không thể hoàn tác!')) {
                window.location.href = deleteUrl;
            }
        });
    });

    // Tự động ẩn alert messages sau 4 giây
    document.querySelectorAll('.alert').forEach(function (alert) {
        setTimeout(function () {
            alert.style.transition = 'opacity 0.5s ease';
            alert.style.opacity = '0';
            setTimeout(function () { alert.remove(); }, 500);
        }, 4000);
    });

});