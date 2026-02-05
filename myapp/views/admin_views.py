"""
Admin Views - WebGIS Xe Điện
Quản lý: Dashboard, Users, Kho, Tài chính, Đơn hàng, Trạm sạc, Thống kê
"""

from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib import messages
from django.db.models import Sum, Count, Avg
from django.utils import timezone
from datetime import timedelta
import json

# Decorator kiểm tra user là admin
def admin_required(user):
    return user.is_staff or user.is_superuser

# ==================== DASHBOARD ====================
@login_required
@user_passes_test(admin_required, login_url='login')
def admin_dashboard(request):
    """
    Dashboard tổng quan - Trang chính Admin
    """
    # Thống kê tổng quan
    from django.contrib.auth.models import User
    # from .models import Product, ChargingStation, Order  # Uncomment khi có models
    
    stats = {
        'total_users': User.objects.count(),
        'total_products': 45,  # Product.objects.count(),
        'total_stations': 32,  # ChargingStation.objects.count(),
        'total_orders': 128,   # Order.objects.count(),
        'revenue_month': 15000000000,  # Doanh thu tháng này
        'expense_month': 8000000000,   # Chi tiêu tháng này
        'profit_month': 7000000000,    # Lợi nhuận
        'stock_low': 5,  # Số sản phẩm sắp hết hàng
    }
    
    # Đơn hàng gần đây (mock data - thay bằng database thực)
    recent_orders = [
        {
            'id': '#1234',
            'customer': 'Nguyễn Văn A',
            'product': 'VinFast VF8',
            'quantity': 1,
            'total': '1,200,000,000 VNĐ',
            'status': 'pending',
            'status_text': 'Chờ xác nhận',
            'date': '01/02/2026'
        },
        {
            'id': '#1233',
            'customer': 'Trần Thị B',
            'product': 'Tesla Model 3',
            'quantity': 1,
            'total': '1,500,000,000 VNĐ',
            'status': 'confirmed',
            'status_text': 'Đã xác nhận',
            'date': '31/01/2026'
        },
        {
            'id': '#1232',
            'customer': 'Lê Văn C',
            'product': 'Hyundai Ioniq 5',
            'quantity': 1,
            'total': '980,000,000 VNĐ',
            'status': 'shipping',
            'status_text': 'Đang giao hàng',
            'date': '30/01/2026'
        },
    ]
    
    context = {
        'stats': stats,
        'recent_orders': recent_orders,
        'admin_name': request.user.username,
    }
    
    return render(request, 'admin/admin_dashboard.html', context)


# ==================== QUẢN LÝ USERS ====================
@login_required
@user_passes_test(admin_required, login_url='login')
def admin_users(request):
    """
    Quản lý Users - Danh sách, thêm, sửa, xóa
    """
    from django.contrib.auth.models import User
    
    users = User.objects.all().order_by('-date_joined')
    
    # Thống kê users
    stats = {
        'total': users.count(),
        'active': users.filter(is_active=True).count(),
        'admin': users.filter(is_staff=True).count(),
        'new_this_month': users.filter(
            date_joined__gte=timezone.now() - timedelta(days=30)
        ).count()
    }
    
    context = {
        'users': users,
        'stats': stats,
    }
    
    return render(request, 'admin/admin_users.html', context)


# ==================== QUẢN LÝ KHO ====================
@login_required
@user_passes_test(admin_required, login_url='login')
def admin_kho(request):
    """
    Quản lý Kho - Sản phẩm, tồn kho, nhập xuất
    """
    # Mock data - thay bằng database thực
    products = [
        {
            'id': 1,
            'name': 'VinFast VF8',
            'category': 'Xe ô tô điện',
            'price': '1,200,000,000',
            'stock': 15,
            'sold': 25,
            'status': 'in_stock',
            'image': 'vinfast_vf8.jpg'
        },
        {
            'id': 2,
            'name': 'Tesla Model 3',
            'category': 'Xe ô tô điện',
            'price': '1,500,000,000',
            'stock': 8,
            'sold': 32,
            'status': 'in_stock',
            'image': 'tesla_model3.jpg'
        },
        {
            'id': 3,
            'name': 'Yadea Xmen Neo',
            'category': 'Xe máy điện',
            'price': '25,000,000',
            'stock': 3,
            'sold': 45,
            'status': 'low_stock',
            'image': 'yadea_xmen.jpg'
        },
        {
            'id': 4,
            'name': 'Hyundai Ioniq 5',
            'category': 'Xe ô tô điện',
            'price': '980,000,000',
            'stock': 0,
            'sold': 12,
            'status': 'out_of_stock',
            'image': 'ioniq5.jpg'
        },
    ]
    
    stats = {
        'total_products': 45,
        'in_stock': 38,
        'low_stock': 5,
        'out_of_stock': 2,
        'total_value': '58,500,000,000 VNĐ'
    }
    
    context = {
        'products': products,
        'stats': stats,
    }
    
    return render(request, 'admin/admin_kho.html', context)


# ==================== QUẢN LÝ TÀI CHÍNH ====================
@login_required
@user_passes_test(admin_required, login_url='login')
def admin_taichinh(request):
    """
    Quản lý Tài chính - Doanh thu, Chi tiêu, Lợi nhuận
    """
    # Dữ liệu doanh thu 12 tháng (mock)
    revenue_data = {
        'labels': ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'],
        'revenue': [12, 15, 18, 14, 20, 22, 19, 25, 23, 28, 30, 35],  # Tỷ VNĐ
        'expense': [8, 9, 10, 9, 11, 12, 10, 13, 12, 14, 15, 16],
        'profit': [4, 6, 8, 5, 9, 10, 9, 12, 11, 14, 15, 19]
    }
    
    # Thống kê tài chính
    stats = {
        'revenue_today': '850,000,000 VNĐ',
        'revenue_month': '15,000,000,000 VNĐ',
        'revenue_year': '285,000,000,000 VNĐ',
        'expense_month': '8,000,000,000 VNĐ',
        'expense_year': '135,000,000,000 VNĐ',
        'profit_month': '7,000,000,000 VNĐ',
        'profit_year': '150,000,000,000 VNĐ',
        'pending_payments': '3,200,000,000 VNĐ',
    }
    
    # Top sản phẩm bán chạy
    top_products = [
        {'name': 'VinFast VF8', 'sold': 25, 'revenue': '30,000,000,000'},
        {'name': 'Tesla Model 3', 'sold': 32, 'revenue': '48,000,000,000'},
        {'name': 'Hyundai Ioniq 5', 'sold': 12, 'revenue': '11,760,000,000'},
    ]
    
    context = {
        'stats': stats,
        'revenue_data': json.dumps(revenue_data),
        'top_products': top_products,
    }
    
    return render(request, 'admin/admin_taichinh.html', context)


# ==================== QUẢN LÝ ĐƠN HÀNG ====================
@login_required
@user_passes_test(admin_required, login_url='login')
def admin_donhang(request):
    """
    Quản lý Đơn hàng - Xem, sửa trạng thái
    """
    # Mock data
    orders = [
        {
            'id': '#1234',
            'customer': 'Nguyễn Văn A',
            'phone': '0901234567',
            'product': 'VinFast VF8',
            'quantity': 1,
            'total': '1,200,000,000',
            'payment': 'Chuyển khoản',
            'status': 'pending',
            'status_text': 'Chờ xác nhận',
            'date': '01/02/2026',
            'address': 'TP.HCM'
        },
        {
            'id': '#1233',
            'customer': 'Trần Thị B',
            'phone': '0912345678',
            'product': 'Tesla Model 3',
            'quantity': 1,
            'total': '1,500,000,000',
            'payment': 'Trả góp',
            'status': 'confirmed',
            'status_text': 'Đã xác nhận',
            'date': '31/01/2026',
            'address': 'Hà Nội'
        },
    ]
    
    stats = {
        'total': 128,
        'pending': 15,
        'confirmed': 45,
        'shipping': 32,
        'completed': 30,
        'cancelled': 6,
    }
    
    context = {
        'orders': orders,
        'stats': stats,
    }
    
    return render(request, 'admin/admin_donhang.html', context)


# ==================== QUẢN LÝ TRẠM SẠC ====================
@login_required
@user_passes_test(admin_required, login_url='login')
def admin_tramsac(request):
    """
    Quản lý Trạm sạc - Vị trí, trạng thái
    """
    # Mock data
    stations = [
        {
            'id': 1,
            'name': 'Trạm sạc VinFast Q1',
            'address': '123 Nguyễn Huệ, Q1, TP.HCM',
            'lat': 10.7769,
            'lng': 106.7009,
            'ports': 8,
            'available': 5,
            'status': 'active',
            'power': '150kW',
            'type': 'DC Fast'
        },
        {
            'id': 2,
            'name': 'Trạm sạc Tesla Thảo Điền',
            'address': '456 Xa lộ Hà Nội, Q2, TP.HCM',
            'lat': 10.8031,
            'lng': 106.7399,
            'ports': 12,
            'available': 8,
            'status': 'active',
            'power': '250kW',
            'type': 'Supercharger'
        },
        {
            'id': 3,
            'name': 'Trạm sạc Phú Mỹ Hưng',
            'address': '789 Nguyễn Văn Linh, Q7, TP.HCM',
            'lat': 10.7282,
            'lng': 106.7219,
            'ports': 6,
            'available': 0,
            'status': 'maintenance',
            'power': '100kW',
            'type': 'DC Fast'
        },
    ]
    
    stats = {
        'total': 32,
        'active': 28,
        'maintenance': 3,
        'inactive': 1,
        'total_ports': 256,
        'available_ports': 184,
    }
    
    context = {
        'stations': stations,
        'stats': stats,
    }
    
    return render(request, 'admin/admin_tramsac.html', context)


# ==================== THỐNG KÊ & BÁO CÁO ====================
@login_required
@user_passes_test(admin_required, login_url='login')
def admin_thongke(request):
    """
    Thống kê & Báo cáo - Biểu đồ chi tiết
    """
    # Dữ liệu cho biểu đồ
    chart_data = {
        'daily_revenue': {
            'labels': ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
            'data': [450, 520, 480, 650, 720, 800, 680]  # Triệu VNĐ
        },
        'product_distribution': {
            'labels': ['Xe ô tô điện', 'Xe máy điện', 'Xe đạp điện', 'Phụ kiện'],
            'data': [45, 35, 15, 5]  # %
        },
        'customer_age': {
            'labels': ['18-25', '26-35', '36-45', '46-55', '56+'],
            'data': [15, 35, 30, 15, 5]  # %
        }
    }
    
    # Top khách hàng
    top_customers = [
        {'name': 'Công ty TNHH ABC', 'orders': 25, 'spent': '45,000,000,000'},
        {'name': 'Nguyễn Văn A', 'orders': 12, 'spent': '18,000,000,000'},
        {'name': 'Trần Thị B', 'orders': 8, 'spent': '12,000,000,000'},
    ]
    
    context = {
        'chart_data': json.dumps(chart_data),
        'top_customers': top_customers,
    }
    
    return render(request, 'admin/admin_thongke.html', context)