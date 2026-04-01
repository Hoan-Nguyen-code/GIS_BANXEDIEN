from myapp.models import Cart, CartItem, Product, Cart, Order, OrderItem, Payment
from django.shortcuts import render, redirect, get_object_or_404
from django.db.models import Sum
from django.http import JsonResponse
from django.utils import timezone
from django.db import transaction
import uuid

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

    cart, _ = Cart.objects.get_or_create(user=request.user)
    items = cart.items.select_related("product")

    if not items.exists():
        return redirect("cart")

    total_price = sum(item.product.price * item.quantity for item in items)

    if request.method == "POST":

        fullname = request.POST.get("fullname")
        phone = request.POST.get("phone")
        address = request.POST.get("address")
        note = request.POST.get("note")
        payment_method = request.POST.get("payment")

        with transaction.atomic():

            order = Order.objects.create(
                user=request.user,
                total_price=0
            )

            order_items = []
            for item in items:
                order_items.append(
                    OrderItem(
                        order=order,
                        product=item.product,
                        quantity=item.quantity,
                        price=item.product.price
                    )
                )

            OrderItem.objects.bulk_create(order_items)

            order.calculate_total()

            payment = Payment.objects.create(
                order=order,
                method="CASH" if payment_method == "cod" else "CARD",
                amount=order.total_price,
                status="PENDING"
            )

        if payment_method == "cod":
            return redirect("order_success")

        return redirect("payment_qr", order_id = order.id)

    return render(request, "checkout/checkout.html", {
        "items": items,
        "total_price": total_price
    })

def payment_qr(request, order_id):

    order = get_object_or_404(Order, id = order_id)

    bank_code = "970422"
    account_number = "123456789" 
    account_name = "NGUYEN VAN A"

    amount = int(order.total_price)
    description = f"ORDER{order.id}"

    qr_url = f"https://img.vietqr.io/image/{bank_code}-{account_number}-compact.png?amount={amount}&addInfo={description}&accountName={account_name}"

    return render(request, "checkout/qr.html", {
        "order": order,
        "qr_url": qr_url
    })

def payment_success(request, order_id):

    order = get_object_or_404(Order, id=order_id)
    payment = order.payment

    payment.status = "SUCCESS"
    payment.paid_at = timezone.now()
    payment.save()

    cart = Cart.objects.get(user=order.user)
    cart.items.all().delete()

    return redirect("order_success")

def order_success(request):
    return render(request, "checkout/success.html")