// ===== HOME.JS - JAVASCRIPT CHO TRANG CHỦ =====

// ===== DOM ELEMENTS =====
const searchInput = document.getElementById('searchInput');
const productsContainer = document.getElementById('productsContainer');
const productCards = document.querySelectorAll('.product-card');
const sidebarItems = document.querySelectorAll('.sidebar-item');
const sortSelect = document.querySelector('.sort-select');
const viewButtons = document.querySelectorAll('.view-btn');
const addToCartButtons = document.querySelectorAll('.add-to-cart-btn');
const cartBadge = document.querySelector('.cart-badge');

// ===== CART FUNCTIONALITY =====
let cartCount = 0;

// Thêm sản phẩm vào giỏ hàng
addToCartButtons.forEach(button => {
    button.addEventListener('click', (e) => {
        e.stopPropagation();
        
        // Hiệu ứng button
        button.style.transform = 'scale(0.9)';
        setTimeout(() => {
            button.style.transform = '';
        }, 200);
        
        // Tăng số lượng giỏ hàng
        cartCount++;
        cartBadge.textContent = cartCount;
        
        // Hiệu ứng badge
        cartBadge.style.transform = 'scale(1.3)';
        setTimeout(() => {
            cartBadge.style.transform = '';
        }, 300);
        
        // Hiển thị thông báo
        showNotification('Đã thêm sản phẩm vào giỏ hàng!', 'success');
    });
});

// ===== SEARCH FUNCTIONALITY =====
let searchTimeout;

searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    const searchTerm = e.target.value.toLowerCase().trim();
    
    searchTimeout = setTimeout(() => {
        filterProducts(searchTerm);
    }, 300);
});

function filterProducts(searchTerm) {
    let visibleCount = 0;
    
    productCards.forEach(card => {
        const productName = card.querySelector('.product-name').textContent.toLowerCase();
        const productDesc = card.querySelector('.product-description').textContent.toLowerCase();
        
        if (productName.includes(searchTerm) || productDesc.includes(searchTerm)) {
            card.style.display = '';
            visibleCount++;
        } else {
            card.style.display = 'none';
        }
    });
    
    // Cập nhật số lượng sản phẩm
    updateProductCount(visibleCount);
}

// ===== CATEGORY FILTER =====
sidebarItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Xóa active class từ tất cả items
        sidebarItems.forEach(i => i.classList.remove('active'));
        
        // Thêm active class cho item được click
        item.classList.add('active');
        
        const category = item.getAttribute('data-category');
        filterByCategory(category);
    });
});

function filterByCategory(category) {
    let visibleCount = 0;
    
    if (category === 'all') {
        productCards.forEach(card => {
            card.style.display = '';
            visibleCount++;
        });
    } else {
        // Logic lọc theo danh mục (cần backend hỗ trợ)
        // Hiện tại chỉ hiển thị tất cả
        productCards.forEach(card => {
            card.style.display = '';
            visibleCount++;
        });
    }
    
    updateProductCount(visibleCount);
    showNotification(`Đang hiển thị ${visibleCount} sản phẩm`, 'info');
}

// ===== SORTING FUNCTIONALITY =====
sortSelect.addEventListener('change', (e) => {
    const sortType = e.target.value;
    sortProducts(sortType);
});

function sortProducts(sortType) {
    const productsArray = Array.from(productCards);
    
    productsArray.sort((a, b) => {
        switch(sortType) {
            case 'name-asc':
                return a.querySelector('.product-name').textContent.localeCompare(
                    b.querySelector('.product-name').textContent
                );
            case 'name-desc':
                return b.querySelector('.product-name').textContent.localeCompare(
                    a.querySelector('.product-name').textContent
                );
            case 'price-asc':
                return getPrice(a) - getPrice(b);
            case 'price-desc':
                return getPrice(b) - getPrice(a);
            default:
                return 0;
        }
    });
    
    // Xóa và thêm lại các card theo thứ tự mới
    productsArray.forEach(card => {
        productsContainer.appendChild(card);
    });
    
    showNotification('Đã sắp xếp sản phẩm', 'info');
}

function getPrice(card) {
    const priceText = card.querySelector('.current-price').textContent;
    return parseInt(priceText.replace(/\D/g, ''));
}

// ===== VIEW TOGGLE =====
viewButtons.forEach(button => {
    button.addEventListener('click', () => {
        // Xóa active class
        viewButtons.forEach(btn => btn.classList.remove('active'));
        
        // Thêm active class
        button.classList.add('active');
        
        const viewType = button.getAttribute('data-view');
        
        if (viewType === 'list') {
            productsContainer.style.gridTemplateColumns = '1fr';
            productCards.forEach(card => {
                card.style.display = 'flex';
                card.querySelector('.product-image').style.width = '300px';
                card.querySelector('.product-image').style.height = '200px';
            });
        } else {
            productsContainer.style.gridTemplateColumns = '';
            productCards.forEach(card => {
                card.style.display = '';
                card.querySelector('.product-image').style.width = '';
                card.querySelector('.product-image').style.height = '';
            });
        }
    });
});

// ===== QUICK VIEW FUNCTIONALITY =====
const quickViewButtons = document.querySelectorAll('.quick-view-btn');

quickViewButtons.forEach(button => {
    button.addEventListener('click', (e) => {
        e.stopPropagation();
        const productCard = button.closest('.product-card');
        const productName = productCard.querySelector('.product-name').textContent;
        
        showNotification(`Xem nhanh: ${productName}`, 'info');
        // Ở đây có thể mở modal để hiển thị chi tiết sản phẩm
    });
});

// ===== PRODUCT CARD CLICK =====
productCards.forEach(card => {
    card.addEventListener('click', () => {
        const productName = card.querySelector('.product-name').textContent;
        showNotification(`Đang xem: ${productName}`, 'info');
        // Redirect đến trang chi tiết sản phẩm
        // window.location.href = '/product/detail/...';
    });
});

// ===== UPDATE PRODUCT COUNT =====
function updateProductCount(count) {
    const productCountElement = document.querySelector('.product-count strong');
    if (productCountElement) {
        productCountElement.textContent = count;
    }
}

// ===== NOTIFICATION SYSTEM =====
function showNotification(message, type = 'info') {
    // Xóa notification cũ nếu có
    const oldNotification = document.querySelector('.notification');
    if (oldNotification) {
        oldNotification.remove();
    }
    
    // Tạo notification mới
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${getNotificationIcon(type)}"></i>
        <span>${message}</span>
    `;
    
    // Thêm styles
    Object.assign(notification.style, {
        position: 'fixed',
        top: '90px',
        right: '30px',
        background: getNotificationColor(type),
        color: 'white',
        padding: '15px 25px',
        borderRadius: '10px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontSize: '14px',
        fontWeight: '600',
        zIndex: '9999',
        animation: 'slideInRight 0.3s ease',
        transition: 'all 0.3s ease'
    });
    
    document.body.appendChild(notification);
    
    // Tự động xóa sau 3 giây
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100px)';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

function getNotificationIcon(type) {
    switch(type) {
        case 'success': return 'check-circle';
        case 'error': return 'exclamation-circle';
        case 'warning': return 'exclamation-triangle';
        default: return 'info-circle';
    }
}

function getNotificationColor(type) {
    switch(type) {
        case 'success': return 'linear-gradient(135deg, #00c896, #00b383)';
        case 'error': return 'linear-gradient(135deg, #ff4757, #ff3838)';
        case 'warning': return 'linear-gradient(135deg, #ffa502, #ff8c00)';
        default: return 'linear-gradient(135deg, #007bff, #0056b3)';
    }
}

// ===== ANIMATION ON SCROLL =====
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Áp dụng animation cho các product cards
productCards.forEach((card, index) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(30px)';
    card.style.transition = `all 0.5s ease ${index * 0.1}s`;
    observer.observe(card);
});

// ===== PAGINATION =====
const pageButtons = document.querySelectorAll('.page-btn');

pageButtons.forEach(button => {
    button.addEventListener('click', () => {
        if (!button.disabled && !button.classList.contains('active')) {
            // Xóa active class
            pageButtons.forEach(btn => btn.classList.remove('active'));
            
            // Thêm active class
            if (button.textContent.trim().match(/^\d+$/)) {
                button.classList.add('active');
            }
            
            // Scroll to top
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
            
            showNotification('Đang tải trang...', 'info');
        }
    });
});

// ===== SMOOTH SCROLL =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// ===== CART ICON ANIMATION =====
const cartIcon = document.querySelector('.cart-icon');

cartIcon.addEventListener('click', () => {
    if (cartCount > 0) {
        showNotification('Đang xem giỏ hàng...', 'info');
        // Redirect đến trang giỏ hàng
        // window.location.href = '/cart/';
    } else {
        showNotification('Giỏ hàng của bạn đang trống', 'warning');
    }
});

// ===== FILTER BUTTON =====
const filterButton = document.querySelector('.search-btn');

filterButton.addEventListener('click', () => {
    showNotification('Đang mở bộ lọc nâng cao...', 'info');
    // Mở modal filter hoặc panel
});

// ===== KEYBOARD SHORTCUTS =====
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + K để focus vào search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInput.focus();
    }
    
    // ESC để clear search
    if (e.key === 'Escape' && searchInput === document.activeElement) {
        searchInput.value = '';
        searchInput.blur();
        filterProducts('');
    }
});

// ===== INIT =====
console.log('🚀 WebGIS Xe Điện - Home page loaded successfully!');

// Hiển thị welcome notification
setTimeout(() => {
    showNotification('Chào mừng bạn đến với WebGIS Xe Điện!', 'success');
}, 500);