from myapp.models import Cart, CartItem, Product
from django.shortcuts import render, redirect, get_object_or_404
from django.db.models import Sum
from django.http import JsonResponse


def cart_view(request):

    if not request.user.is_authenticated:
        return redirect("login")

    cart, created = Cart.objects.get_or_create(user=request.user)

    items = cart.items.select_related("product")

    total_price = sum(item.product.price * item.quantity for item in items)

    cart_count = items.aggregate(
        total=Sum("quantity")
    )["total"] or 0

    return render(request, "cart/cart.html", {
        "cart": cart,
        "items": items,
        "total_price": total_price,
        "cart_count": cart_count
    })


def add_to_cart(request, product_id):

    if not request.user.is_authenticated:
        return JsonResponse({"error": "login_required"}, status=401)

    cart, created = Cart.objects.get_or_create(user=request.user)

    product = get_object_or_404(Product, id=product_id)

    item, created = CartItem.objects.get_or_create(
        cart=cart,
        product=product,
        defaults={"quantity": 1}
    )

    if not created:
        item.quantity += 1
        item.save()

    # tính lại tổng số sản phẩm
    cart_count = cart.items.aggregate(
        total=Sum("quantity")
    )["total"] or 0

    return JsonResponse({
        "success": True,
        "cart_count": cart_count
    })


def remove_from_cart(request, item_id):

    if not request.user.is_authenticated:
        return redirect("login")

    cart = get_object_or_404(Cart, user=request.user)

    item = get_object_or_404(CartItem, id=item_id, cart=cart)

    item.delete()

    return redirect("cart")


def checkout(request):

    if not request.user.is_authenticated:
        return redirect("login")

    cart, created = Cart.objects.get_or_create(user=request.user)

    items = cart.items.select_related("product")

    total_price = sum(item.product.price * item.quantity for item in items)

    return render(request, "cart/checkout.html", {
        "cart": cart,
        "items": items,
        "total_price": total_price
    })