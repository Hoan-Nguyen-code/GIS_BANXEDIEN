from django.shortcuts import render, redirect
from myapp.models import Product, Category  # chỉnh lại theo app của bạn

def home(request):
    if request.user.is_authenticated and request.user.role == 'ADMIN':
        return redirect('admin_dashboard')
    # Lấy category từ query string (?category=1)
    category_id = request.GET.get("category")

    # Chỉ lấy sản phẩm active
    products = Product.objects.filter(is_active=True)

    if category_id:
        products = products.filter(category_id=category_id)

    # Lấy toàn bộ category để render sidebar
    categories = Category.objects.all()

    # Lấy giỏ hàng từ session
    cart = request.session.get("cart", {})
    cart_count = sum(item["quantity"] for item in cart.values())

    context = {
        "products": products,
        "categories": categories,
        "cart_count": cart_count,
    }

    return render(request, "home/home.html", context)
