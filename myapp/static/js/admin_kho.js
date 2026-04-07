document.addEventListener('DOMContentLoaded', function () {

    document.querySelectorAll('.btn-delete-product').forEach(function (btn) {
        btn.addEventListener('click', function () {
            const productId = this.dataset.id;
            const productName = this.dataset.name;
            const deleteUrl = this.dataset.url;

            if (confirm('Bạn có chắc muốn xóa sản phẩm "' + productName + '"?\nHành động này không thể hoàn tác!')) {
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