from django.urls import path
from myapp.views import auth_views, home_views , admin_views
from django.contrib import admin

urlpatterns = [
    # Trang đăng nhập
    path('login/', auth_views.login_view, name='login'),
    
    # Trang đăng xuất
    path('logout/', auth_views.logout_view, name='logout'),
    
    # Trang chủ - SỬA DÒNG NÀY
    path('', home_views.home_view, name='home'),  # Đổi từ auth_views.home_view thành home_views.home
    
    # Trang đăng ký
    path('register/', auth_views.register_view, name='register'),
    
 # ADMIN CUSTOM (ĐỔI PREFIX)
    path('dashboard/', admin_views.admin_dashboard, name='admin_dashboard'),
    path('dashboard/users/', admin_views.admin_users, name='admin_users'),
    path('dashboard/kho/', admin_views.admin_kho, name='admin_kho'),
    path('dashboard/taichinh/', admin_views.admin_taichinh, name='admin_taichinh'),
    path('dashboard/donhang/', admin_views.admin_donhang, name='admin_donhang'),
    path('dashboard/tramsac/', admin_views.admin_tramsac, name='admin_tramsac'),
    path('dashboard/thongke/', admin_views.admin_thongke, name='admin_thongke'),

    # Django Admin GIỮ NGUYÊN
    path('admin/', admin.site.urls),
]