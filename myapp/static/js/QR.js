const bankOption = document.querySelector('input[value="bank"]');
const codOption = document.querySelector('input[value="cod"]');
const qrBox = document.getElementById("bank-info");
const qrImg = document.getElementById("qr-preview");
const form = document.getElementById("checkout-form");
const total = form.dataset.total;

function updateQR() {

    const orderCode = "TEMP";

    const url = `https://img.vietqr.io/image/970422-123456789-compact.png?amount=${total}&addInfo=${orderCode}&accountName=NGUYEN%20VAN%20A`;

    qrImg.src = url;
}

bankOption.addEventListener("change", () => {
    qrBox.style.display = "block";
    updateQR();
});

codOption.addEventListener("change", () => {
    qrBox.style.display = "none";
});