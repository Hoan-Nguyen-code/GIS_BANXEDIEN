from django.shortcuts import render
from django.contrib.auth.decorators import login_required

@login_required
def home(request):
    context = {
        'user': request.user,
    }
    return render(request, 'login/home.html', context)

def home(request):
    cart = request.session.get("cart", {})
    cart_count = sum(item["quantity"] for item in cart.values())

    return render(request, "login/home.html", {
        "cart_count": cart_count
    })
