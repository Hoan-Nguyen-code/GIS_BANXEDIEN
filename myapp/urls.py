from django.urls import path
from myapp.views import auth_views, home_views, map_views, product_detail_views

urlpatterns = [
    path('login/', auth_views.login_view, name='login'),
    path('logout/', auth_views.logout_view, name='logout'),
    path('', home_views.home, name='home'),
    path('register/', auth_views.register_view, name='register'),
    path('admin/dashboard/', auth_views.admin_dashboard_view, name='admin_dashboard'),
    path("map/", map_views.map_view, name="map"),
    path("product/<int:product_id>/", product_detail_views.product_detail, name="product_detail")
]