from django.db.models import Sum
from .models import Cart

def cart_count(request):

    if not request.user.is_authenticated:
        return {"cart_count": 0}

    cart, created = Cart.objects.get_or_create(user=request.user)

    count = cart.items.aggregate(
        total=Sum("quantity")
    )["total"] or 0

    return {
        "cart_count": count
    }