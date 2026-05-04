document.addEventListener('DOMContentLoaded', function () {

    document.querySelectorAll('.btn-delete-order').forEach(function (btn) {
        btn.addEventListener('click', function () {
            const orderId = this.dataset.id;
            const deleteUrl = this.dataset.url;

            if (confirm('Bạn có chắc muốn xóa đơn hàng #' + orderId + '?\nHành động này không thể hoàn tác!')) {
                window.location.href = deleteUrl;
            }
        });
    });

    document.querySelectorAll('.alert').forEach(function (alert) {
        setTimeout(function () {
            alert.style.transition = 'opacity 0.5s ease';
            alert.style.opacity = '0';
            setTimeout(function () { alert.remove(); }, 500);
        }, 4000);
    });

});

function filterStatus(value) {
    if (value === '') {
        window.location.href = window.location.pathname;
    } else {
        window.location.href = window.location.pathname + '?status=' + value;
    }
}