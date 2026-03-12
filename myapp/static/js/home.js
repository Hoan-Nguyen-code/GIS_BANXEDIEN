document.addEventListener("DOMContentLoaded", function () {

    /* ===============================
       SAFE SELECTORS
    =============================== */

    const productCards = document.querySelectorAll(".product-card");
    const productsGrid = document.querySelector(".products-grid");
    const searchInput = document.querySelector('input[name="q"]');
    const viewButtons = document.querySelectorAll(".view-btn");
    const addToCartButtons = document.querySelectorAll(".add-to-cart-btn");

    /* ===============================
       NOTIFICATION SYSTEM
    =============================== */

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

    /* ===============================
       ADD TO CART
    =============================== */

    const cartCountElement = document.getElementById("cart-count");

    addToCartButtons.forEach(button => {

        button.addEventListener("click", function (e) {

            e.preventDefault();
            e.stopPropagation();

            const productId = this.dataset.productId;

            fetch(`/cart/add/${productId}/`)
            .then(response => response.json())
            .then(data => {

                if(data.success){

                    showNotification("Đã thêm sản phẩm vào giỏ hàng", "success");

                    if(cartCountElement){
                        cartCountElement.textContent = data.cart_count;
                    }

                } else if(data.error === "login_required") {

                    showNotification("Vui lòng đăng nhập", "warning");
                    window.location.href = "/login/";

                }

            });

        });

    });

    /* ===============================
       VIEW TOGGLE
    =============================== */

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

    /* ===============================
       SEARCH FILTER
    =============================== */

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

    /* ===============================
       SORT DROPDOWN (SAFE VERSION)
    =============================== */

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

    console.log("Home.js loaded safely");

});