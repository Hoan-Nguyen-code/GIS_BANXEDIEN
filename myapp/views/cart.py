from myapp.models import Cart
from django.shortcuts import render, redirect

def cart_view(request):
    if not request.user.is_authenticated:
        return redirect("login")

    cart, created = Cart.objects.get_or_create(user=request.user)

    items = cart.items.select_related("product")

    total_price = sum(
        item.product.price * item.quantity for item in items
    )

    return render(request, "cart/cart.html", {
        "cart": cart,
        "items": items,
        "total_price": total_price
    })