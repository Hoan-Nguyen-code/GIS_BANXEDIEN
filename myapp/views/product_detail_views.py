from django.shortcuts import render

def product_detail(request, product_id):

    products = [
        {
        "id": 1,
        "name": "Xe đạp điện thông minh A1",
        "category": "bicycle",
        "price": "15.500.000đ",
        "old_price": "18.000.000đ",
        "badge": "new",
        "rating": 4.5,
        "description": "Xe đạp điện cao cấp, pin lithium 48V, quãng đường 60km",
        "image": "images/products/bike1.jpg",
    },
    {
        "id": 2,
        "name": "Xe máy điện cao cấp B2",
        "category": "motorbike",
        "price": "32.000.000đ",
        "old_price": "40.000.000đ",
        "badge": "sale",
        "rating": 4.0,
        "description": "Thiết kế thể thao, vận tốc tối đa 80km/h, pin 72V",
        "image": "images/products/bike2.jpg",
    },
    {
        "id": 3,
        "name": "Xe ô tô điện 4 chỗ C1",
        "category": "car",
        "price": "850.000.000đ",
        "old_price": None,
        "badge": "hot",
        "rating": 5.0,
        "description": "Xe ô tô điện 4 chỗ, quãng đường 350km, sạc nhanh",
        "image": "images/products/car1.jpg",
    },
    {
        "id": 4,
        "name": "Xe đạp điện gấp gọn A2",
        "category": "bicycle",
        "price": "12.500.000đ",
        "old_price": None,
        "badge": None,
        "rating": 4.2,
        "description": "Xe đạp điện gấp gọn tiện lợi, pin 36V, phù hợp đi làm",
        "image": "images/products/bike3.jpg",
    },
    {
        "id": 5,
        "name": "Xe máy điện phong cách B3",
        "category": "motorbike",
        "price": "28.500.000đ",
        "old_price": None,
        "badge": "new",
        "rating": 4.6,
        "description": "Thiết kế sang trọng, pin 60V, phanh ABS an toàn",
        "image": "images/products/bike4.jpg",
    },
    {
        "id": 6,
        "name": "Bộ sạc nhanh thông minh X1",
        "category": "accessories",
        "price": "2.550.000đ",
        "old_price": "3.000.000đ",
        "badge": "sale",
        "rating": 4.8,
        "description": "Sạc nhanh an toàn, tương thích đa dòng xe, bảo hành 2 năm",
        "image": "images/products/accessory1.jpg",
    },
    {
        "id": 7,
        "name": "Xe đạp điện địa hình A3",
        "category": "bicycle",
        "price": "18.900.000đ",
        "old_price": None,
        "badge": None,
        "rating": 4.3,
        "description": "Xe đạp địa hình mạnh mẽ, pin 48V, lốp to chống trượt",
        "image": "images/products/bike5.jpg",
    },
    {
        "id": 8,
        "name": "Xe máy điện đa năng B4",
        "category": "motorbike",
        "price": "35.000.000đ",
        "old_price": None,
        "badge": "hot",
        "rating": 4.7,
        "description": "Xe máy điện đa chức năng, pin khủng 72V, khoang chứa lớn",
        "image": "images/products/bike6.jpg",
    }
    ]

    product = next(p for p in products if p["id"] == product_id)

    related_products = [
        p for p in products
        if p["category"] == product["category"] and p["id"] != product_id
    ]

    return render(request, "product_detail.html", {
        "product": product,
        "related_products": related_products
    })
