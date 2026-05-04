document.addEventListener('DOMContentLoaded', function() {
    // Highlight active menu based on current URL
    const currentPath = window.location.pathname;
    document.querySelectorAll('.menu-item').forEach(item => {
        if (item.getAttribute('href') === currentPath) {
            document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
        }
    });
});

function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.toggle('active');
}

document.querySelectorAll('.btn-action.view').forEach(btn => {
    btn.addEventListener('click', function() {
        const row = this.closest('tr');
        const id = row.querySelector('td:first-child').textContent;
        showModal('Chi tiết', `Xem chi tiết item ${id}`);
    });
});

document.querySelectorAll('.btn-action.edit').forEach(btn => {
    btn.addEventListener('click', function() {
        const row = this.closest('tr');
        const id = row.querySelector('td:first-child').textContent;
        showModal('Chỉnh sửa', `Chỉnh sửa item ${id}`);
    });
});

document.querySelectorAll('.btn-action.delete').forEach(btn => {
    btn.addEventListener('click', function() {
        const row = this.closest('tr');
        const id = row.querySelector('td:first-child').textContent;
        
        if (confirm(`Bạn có chắc muốn xóa item ${id}?`)) {
            // Call API to delete
            deleteItem(id, row);
        }
    });
});

async function deleteItem(id, rowElement) {
    try {
        // Uncomment when API ready
        // const response = await fetch(`/api/delete/${id}/`, {
        //     method: 'DELETE',
        //     headers: {
        //         'X-CSRFToken': getCookie('csrftoken')
        //     }
        // });
        
        // if (response.ok) {
        //     rowElement.remove();
        //     showNotification('Đã xóa thành công!', 'success');
        // }
        
        // Mock delete
        rowElement.style.transition = 'opacity 0.3s';
        rowElement.style.opacity = '0';
        setTimeout(() => {
            rowElement.remove();
            showNotification('Đã xóa thành công!', 'success');
        }, 300);
    } catch (error) {
        showNotification('Lỗi: ' + error.message, 'error');
    }
}

function showModal(title, content) {
    // Create modal if not exists
    let modal = document.getElementById('adminModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'adminModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2 id="modalTitle">${title}</h2>
                    <span class="modal-close">&times;</span>
                </div>
                <div class="modal-body" id="modalBody">
                    ${content}
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        modal.querySelector('.modal-close').addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    } else {
        document.getElementById('modalTitle').textContent = title;
        document.getElementById('modalBody').innerHTML = content;
    }
    
    modal.style.display = 'block';
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateY(0)';
    }, 100);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(-20px)';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function filterTable(searchTerm) {
    const table = document.querySelector('.data-table tbody');
    const rows = table.querySelectorAll('tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        if (text.includes(searchTerm.toLowerCase())) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

function setupPagination(itemsPerPage = 10) {
    const table = document.querySelector('.data-table tbody');
    const rows = Array.from(table.querySelectorAll('tr'));
    const pageCount = Math.ceil(rows.length / itemsPerPage);
    let currentPage = 1;
    
    function showPage(page) {
        const start = (page - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        
        rows.forEach((row, index) => {
            row.style.display = (index >= start && index < end) ? '' : 'none';
        });
    }
    
    const pagination = document.createElement('div');
    pagination.className = 'pagination';
    
    for (let i = 1; i <= pageCount; i++) {
        const btn = document.createElement('button');
        btn.textContent = i;
        btn.addEventListener('click', () => {
            currentPage = i;
            showPage(currentPage);
            document.querySelectorAll('.pagination button').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
        if (i === 1) btn.classList.add('active');
        pagination.appendChild(btn);
    }
    
    document.querySelector('.table-container').appendChild(pagination);
    showPage(1);
}

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(amount);
}

function formatDate(date) {
    return new Intl.DateTimeFormat('vi-VN').format(new Date(date));
}

function exportToCSV(filename = 'data.csv') {
    const table = document.querySelector('.data-table');
    const rows = Array.from(table.querySelectorAll('tr'));
    
    const csv = rows.map(row => {
        const cells = Array.from(row.querySelectorAll('th, td'));
        return cells.map(cell => `"${cell.textContent.trim()}"`).join(',');
    }).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
}

    function createChart(canvasId, type, data, customOptions = {}) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    return new Chart(canvas.getContext('2d'), {
        type: type,
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            resizeDelay: 100,

            plugins: {
                legend: {
                    position: 'top'
                },
                zoom: {
                    pan: { enabled: false },
                    zoom: {
                        wheel: { enabled: false },
                        pinch: { enabled: false }
                    }
                }
            },

            scales: {
                y: {
                    beginAtZero: true
                }
            },

            ...customOptions
        }
    });
}

function startRealtimeUpdates(interval = 30000) {
    setInterval(async () => {
        try {
            // Fetch latest stats
            // const response = await fetch('/api/admin/stats/');
            // const data = await response.json();
            // updateDashboard(data);
        } catch (error) {
            console.error('Failed to fetch updates:', error);
        }
    }, interval);
}

window.addEventListener('DOMContentLoaded', () => {
    console.log('Admin Panel loaded successfully');
    
    // Initialize features if needed
    // setupPagination(10);
    // startRealtimeUpdates();
});