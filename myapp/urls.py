from django.urls import path
from django.contrib import admin
from myapp.views import auth_views, home_views, map_views, product_detail_views, admin_views, cart, news_views, errors

urlpatterns = [
    # USER CUSTOM
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
    path("cart/increase/<int:item_id>/", cart.increase_quantity, name="increase_quantity"),
    path("cart/decrease/<int:item_id>/", cart.decrease_quantity, name="decrease_quantity"),
    
    # ADMIN CUSTOM
    path('dashboard/', admin_views.admin_dashboard, name='admin_dashboard'),
    path('dashboard/users/', admin_views.admin_users, name='admin_users'),
    path('dashboard/users/add/', admin_views.admin_user_add, name='admin_user_add'),
    path('dashboard/users/<int:user_id>/', admin_views.admin_user_detail, name='admin_user_detail'),
    path('dashboard/users/<int:user_id>/edit/', admin_views.admin_user_edit, name='admin_user_edit'),
    path('dashboard/users/<int:user_id>/delete/', admin_views.admin_user_delete, name='admin_user_delete'),
    path('dashboard/kho/', admin_views.admin_kho, name='admin_kho'),
    path('dashboard/kho/add/', admin_views.admin_product_add, name='admin_product_add'),
    path('dashboard/kho/<int:product_id>/', admin_views.admin_product_detail, name='admin_product_detail'),
    path('dashboard/kho/<int:product_id>/edit/', admin_views.admin_product_edit, name='admin_product_edit'),
    path('dashboard/kho/<int:product_id>/delete/', admin_views.admin_product_delete, name='admin_product_delete'),
    path('dashboard/taichinh/', admin_views.admin_taichinh, name='admin_taichinh'),
    path('dashboard/donhang/', admin_views.admin_donhang, name='admin_donhang'),
    path('dashboard/donhang/<int:order_id>/', admin_views.admin_order_detail, name='admin_order_detail'),
    path('dashboard/donhang/<int:order_id>/edit/', admin_views.admin_order_edit, name='admin_order_edit'),
    path('dashboard/donhang/<int:order_id>/delete/', admin_views.admin_order_delete, name='admin_order_delete'),
    path('dashboard/tramsac/', admin_views.admin_tramsac, name='admin_tramsac'),
    path('dashboard/tramsac/add/', admin_views.admin_station_add, name='admin_station_add'),
    path('dashboard/tramsac/<int:station_id>/', admin_views.admin_station_detail, name='admin_station_detail'),
    path('dashboard/tramsac/<int:station_id>/edit/', admin_views.admin_station_edit, name='admin_station_edit'),
    path('dashboard/tramsac/<int:station_id>/delete/', admin_views.admin_station_delete, name='admin_station_delete'),
    path('dashboard/thongke/', admin_views.admin_thongke, name='admin_thongke'),
    
    # API Station
    path('api/stations/', admin_views.api_stations, name='api_stations'),
    path('api/search-history/', admin_views.api_search_history, name='api_search_history'),
    path('search/', admin_views.search_page, name='search_page'),
    
    # Django Admin
    path('admin/', admin.site.urls),
]
handler400 = 'myapp.views.errors.error_400'
handler403 = 'myapp.views.errors.error_403'
handler404 = 'myapp.views.errors.error_404'
handler500 = 'myapp.views.errors.error_500'