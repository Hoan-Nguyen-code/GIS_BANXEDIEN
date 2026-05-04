document.addEventListener('DOMContentLoaded', function () {

    // --- 1. CHẶN NHẬP SỐ ÂM VÀ DẤU LẠ (Thêm phần này) ---
    // Tìm tất cả các ô input có class 'no-spin' hoặc type là number trong Modal
    const numberInputs = document.querySelectorAll('input[type="number"]');
    
    numberInputs.forEach(input => {
        input.addEventListener('input', function() {
    if (this.value < 0 || this.value === "") {
        this.value = this.getAttribute('min') || 0; // Tự về 0 hoặc giá trị min đã đặt
    }
});

        // Chặn việc dán (paste) số âm hoặc kéo thả số âm vào ô
        input.addEventListener('input', function() {
            if (this.value < 0) {
                this.value = 0;
            }
        });
    });

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
// Dán trực tiếp vào cuối file admin_kho.html để test
document.addEventListener('DOMContentLoaded', function () {
    const inputs = document.querySelectorAll('.no-spin');
    inputs.forEach(input => {
        input.addEventListener('keydown', function(e) {
            if (['-', '+', 'e', 'E'].includes(e.key)) e.preventDefault();
        });
        input.addEventListener('input', function() {
            if (this.value < 0) this.value = 0;
        });
    });
});