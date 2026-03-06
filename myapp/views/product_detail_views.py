from django.shortcuts import render, get_object_or_404
from myapp.models import Product

def product_detail(request, product_id):

    product = get_object_or_404(Product, id=product_id)

    related_products = Product.objects.filter(
        category=product.category
    ).exclude(id=product.id)[:4]

    context = {
        "product": product,
        "related_products": related_products
    }

    return render(request, "product/product_detail.html", context)