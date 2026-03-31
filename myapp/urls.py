from django.urls import path
from django.contrib import admin
from myapp.views import auth_views, home_views, map_views, product_detail_views, admin_views, cart, news_views

urlpatterns = [
    path('login/', auth_views.login_view, name='login'),
    path('logout/', auth_views.logout_view, name='logout'),
    path('', home_views.home, name='home'),
    path('register/', auth_views.register_view, name='register'),
    path("cart/", cart.cart_view, name="cart"),
    path("map/", map_views.map_view, name="map"),
    path("product/<int:product_id>/", product_detail_views.product_detail, name="product_detail"),
    path("cart/add/<int:product_id>/", cart.add_to_cart, name="add_to_cart"),
    path("cart/remove/<int:item_id>/", cart.remove_from_cart, name="remove_from_cart"),
    path("checkout/", cart.checkout, name="checkout"),
    path("news/", news_views.news_page, name="news_page"),
    path("api/news/", news_views.get_news, name="api_news"),
    path("checkout/qr/<int:order_id>/", cart.payment_qr, name="payment_qr"),
    path("checkout/success/", cart.order_success, name="order_success"),
    path("checkout/success/<int:order_id>/", cart.payment_success, name="payment_success"),

    # ADMIN CUSTOM
    path('dashboard/', admin_views.admin_dashboard, name='admin_dashboard'),
    path('dashboard/users/', admin_views.admin_users, name='admin_users'),
    path('dashboard/kho/', admin_views.admin_kho, name='admin_kho'),
    path('dashboard/taichinh/', admin_views.admin_taichinh, name='admin_taichinh'),
    path('dashboard/donhang/', admin_views.admin_donhang, name='admin_donhang'),
    path('dashboard/tramsac/', admin_views.admin_tramsac, name='admin_tramsac'),
    path('dashboard/thongke/', admin_views.admin_thongke, name='admin_thongke'),

    # Django Admin
    path('admin/', admin.site.urls),
]