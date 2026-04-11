from django.shortcuts import render, redirect
from myapp.models import Product, Category

def home(request):
    if request.user.is_authenticated and request.user.role == 'ADMIN':
        return redirect('admin_dashboard')

    category_id = request.GET.get("category")

    products = Product.objects.filter(is_active=True)

    if category_id:
        products = products.filter(category_id=category_id)

    categories = Category.objects.all()

    cart = request.session.get("cart", {})
    cart_count = sum(item["quantity"] for item in cart.values())

    context = {
        "products": products,
        "categories": categories,
        "cart_count": cart_count,
    }

    return render(request, "home/home.html", context)
