document.addEventListener("DOMContentLoaded", function () {
    const productCards = document.querySelectorAll(".product-card");
    const productsGrid = document.querySelector(".products-grid");
    const searchInput = document.querySelector('input[name="q"]');
    const viewButtons = document.querySelectorAll(".view-btn");
    const addToCartButtons = document.querySelectorAll(".add-to-cart-btn");

    function showNotification(message, type = "info") {

        const old = document.querySelector(".notification");
        if (old) old.remove();

        const notification = document.createElement("div");
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${getIcon(type)}"></i>
            <span>${message}</span>
        `;

        Object.assign(notification.style, {
            position: "fixed",
            top: "90px",
            right: "30px",
            background: getColor(type),
            color: "white",
            padding: "14px 22px",
            borderRadius: "10px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontSize: "14px",
            fontWeight: "600",
            zIndex: "9999"
        });

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 2500);
    }

    function getIcon(type) {
        return {
            success: "check-circle",
            error: "exclamation-circle",
            warning: "exclamation-triangle",
            info: "info-circle"
        }[type] || "info-circle";
    }

    function getColor(type) {
        return {
            success: "linear-gradient(135deg,#00c896,#00b383)",
            error: "linear-gradient(135deg,#ff4757,#ff3838)",
            warning: "linear-gradient(135deg,#ffa502,#ff8c00)",
            info: "linear-gradient(135deg,#007bff,#0056b3)"
        }[type] || "linear-gradient(135deg,#007bff,#0056b3)";
    }

    const cartCountElement = document.getElementById("cart-count");

    if (!window.addToCartInitialized) {

        document.addEventListener("click", function (e) {

            const button = e.target.closest(".add-to-cart-btn");
            if (!button) return;

            e.preventDefault();

            if (button.classList.contains("loading")) return;
            button.classList.add("loading");

            const url = button.dataset.url;

            fetch(url)
            .then(response => response.json())
            .then(data => {

                if (data.success) {

                    showNotification("Đã thêm sản phẩm vào giỏ hàng 😍", "success");

                    if (cartCountElement) {
                        cartCountElement.textContent = data.cart_count;
                    }

                    if (window.location.pathname.includes("cart")) {
                        setTimeout(() => {
                            window.location.reload();
                        }, 800);
                    }

                } else if (data.error === "login_required") {

                    showNotification("Vui lòng đăng nhập", "warning");
                    window.location.href = "/login/";
                }

            })
            .finally(() => {
                setTimeout(() => {
                    button.classList.remove("loading");
                }, 500);
            });

        });

        window.addToCartInitialized = true;
    }

    if (productsGrid) {
        viewButtons.forEach(button => {
            button.addEventListener("click", () => {

                viewButtons.forEach(btn => btn.classList.remove("active"));
                button.classList.add("active");

                const viewType = button.dataset.view;

                if (viewType === "list") {
                    productsGrid.style.gridTemplateColumns = "1fr";
                    productCards.forEach(card => {
                        card.style.display = "flex";
                        card.style.alignItems = "center";
                        card.style.gap = "20px";
                    });
                } else {
                    productsGrid.style.gridTemplateColumns = "";
                    productCards.forEach(card => {
                        card.style.display = "";
                        card.style.alignItems = "";
                        card.style.gap = "";
                    });
                }
            });
        });
    }

    if (searchInput && productCards.length > 0) {
        searchInput.addEventListener("input", function () {

            const keyword = this.value.toLowerCase().trim();

            productCards.forEach(card => {
                const name = card.querySelector(".product-name")?.textContent.toLowerCase() || "";
                const desc = card.querySelector(".product-description")?.textContent.toLowerCase() || "";

                card.style.display =
                    name.includes(keyword) || desc.includes(keyword)
                        ? ""
                        : "none";
            });
        });
    }

    const dropdown = document.querySelector(".sort-dropdown");

    if (dropdown) {

        const selected = dropdown.querySelector(".sort-selected");
        const options = dropdown.querySelector(".sort-options");
        const selectedText = document.getElementById("selected-text");
        const hiddenInput = document.getElementById("sort-input");

        selected.addEventListener("click", (e) => {
            e.stopPropagation();
            dropdown.classList.toggle("open");
        });

        options.querySelectorAll("li").forEach(option => {
            option.addEventListener("click", () => {

                options.querySelectorAll("li")
                    .forEach(o => o.classList.remove("active"));

                option.classList.add("active");

                if (selectedText)
                    selectedText.textContent = option.textContent;

                if (hiddenInput)
                    hiddenInput.value = option.dataset.value;

                dropdown.classList.remove("open");
            });
        });

        document.addEventListener("click", () => {
            dropdown.classList.remove("open");
        });
    }

    const slider = document.querySelector(".banner-slider");
    const track = document.querySelector(".banner-track");

    if (slider && track) {

        const slides = track.querySelectorAll("img");
        let index = 0;

        function updateBackground() {
            slider.style.backgroundImage = `url(${slides[index].src})`;
        }

        function moveSlide() {
            index++;

            if (index >= slides.length) {
                index = 0;
            }

            track.style.transform = `translateX(-${index * 100}%)`;
            updateBackground();
        }

        // init
        updateBackground();

        let interval = setInterval(moveSlide, 3000);

        // pause khi hover
        slider.addEventListener("mouseenter", () => {
            clearInterval(interval);
        });

        slider.addEventListener("mouseleave", () => {
            interval = setInterval(moveSlide, 3000);
        });
    }

    console.log("Home.js loaded safely");

});