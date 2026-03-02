from django.urls import path
from django.contrib import admin
from myapp.views import auth_views, home_views, map_views, product_detail_views, admin_views, cart

urlpatterns = [
    path('login/', auth_views.login_view, name='login'),
    path('logout/', auth_views.logout_view, name='logout'),
    path('home/', home_views.home, name='home'),
    path("cart/", cart.cart_view, name="cart"),
    path('register/', auth_views.register_view, name='register'),
    path("map/", map_views.map_view, name="map"),
    #path("product/<int:product_id>/", product_detail_views.product_detail, name="product_detail"),

    # ADMIN CUSTOM
    #path('dashboard/', admin_views.admin_dashboard, name='admin_dashboard'),
    #path('dashboard/users/', admin_views.admin_users, name='admin_users'),
    #path('dashboard/kho/', admin_views.admin_kho, name='admin_kho'),
    #path('dashboard/taichinh/', admin_views.admin_taichinh, name='admin_taichinh'),
    #path('dashboard/donhang/', admin_views.admin_donhang, name='admin_donhang'),
    #path('dashboard/tramsac/', admin_views.admin_tramsac, name='admin_tramsac'),
    #path('dashboard/thongke/', admin_views.admin_thongke, name='admin_thongke'),

    # Django Admin
    path('admin/', admin.site.urls),
]
