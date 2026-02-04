from django.urls import path
from myapp.views import auth_views, home_views

urlpatterns = [
    # Trang đăng nhập
    path('login/', auth_views.login_view, name='login'),
    
    # Trang đăng xuất
    path('logout/', auth_views.logout_view, name='logout'),
    
    # Trang chủ - SỬA DÒNG NÀY
    path('', home_views.home, name='home'),  # Đổi từ auth_views.home_view thành home_views.home
    
    # Trang đăng ký
    path('register/', auth_views.register_view, name='register'),
    
    # Trang admin
    path('admin/dashboard/', auth_views.admin_dashboard_view, name='admin_dashboard')
]