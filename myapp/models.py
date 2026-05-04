from django.db import models, transaction
from django.contrib.auth.models import AbstractUser
from django.db.models import TextChoices, Sum, F
from django.core.validators import MinValueValidator, MaxValueValidator
from ckeditor_uploader.fields import RichTextUploadingField

# ==============================
# 1. USER
# ==============================
class User(AbstractUser):
    class Role(TextChoices):
        ADMIN = "ADMIN", "Admin"
        CUSTOMER = "CUSTOMER", "Customer"

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.CUSTOMER
    )

    phone = models.CharField(max_length=15, blank=True)
    address = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if self.role == self.Role.ADMIN:
            self.is_staff = True
            self.is_superuser = True
        else:
            self.is_staff = False
            self.is_superuser = False
        super().save(*args, **kwargs)

    def is_admin(self):
        return self.role == self.Role.ADMIN

    def __str__(self):
        return self.username

# ==============================
# 2. CATEGORY
# ==============================

class Category(models.Model):
    class CategoryType(TextChoices):
        ELECTRIC_BIKE = "ELECTRIC_BIKE", "Xe đạp điện"
        ELECTRIC_MOTORBIKE = "ELECTRIC_MOTORBIKE", "Xe máy điện"
        ELECTRIC_CAR = "ELECTRIC_CAR", "Xe hơi điện"
        ACCESSORY = "ACCESSORY", "Phụ kiện"

    name = models.CharField(max_length=100, unique=True)
    type = models.CharField(max_length=30, choices=CategoryType.choices)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name

# ==============================
# 3. PRODUCT
# ==============================

class Product(models.Model):
    name = models.CharField(max_length=200)
    category = models.ForeignKey(Category, on_delete=models.PROTECT)
    description = RichTextUploadingField()
    price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    image = models.ImageField(upload_to="products/")
    is_active = models.BooleanField(default=True)

    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name="products_created"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["is_active"]),
            models.Index(fields=["created_at"]),
        ]

    def __str__(self):
        return self.name

# ==============================
# 4. INVENTORY
# ==============================

class Inventory(models.Model):
    product = models.OneToOneField(Product, on_delete=models.CASCADE)
    stock_quantity = models.PositiveIntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.CheckConstraint(
                condition=models.Q(stock_quantity__gte=0),
                name="stock_non_negative"
            )
        ]

    def __str__(self):
        return f"{self.product.name} - {self.stock_quantity}"

# ==============================
# 5. IMPORT (STOCK IN)
# ==============================

class StockIn(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    import_price = models.DecimalField(max_digits=12, decimal_places=2)
    imported_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    imported_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        is_new = self.pk is None

        with transaction.atomic():
            super().save(*args, **kwargs)

            if is_new:
                inventory, _ = Inventory.objects.get_or_create(product=self.product)

                # Dùng F expression để tránh race condition
                inventory.stock_quantity = F("stock_quantity") + self.quantity
                inventory.save(update_fields=["stock_quantity", "updated_at"])
                inventory.refresh_from_db()

    def __str__(self):
        return f"Stock In - {self.product.name} ({self.quantity})"

# ==============================
# 6. EXPORT (STOCK OUT)
# ==============================

class StockOut(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    exported_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    exported_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        is_new = self.pk is None

        with transaction.atomic():
            if is_new:
                # khóa dòng inventory để tránh race condition
                inventory = Inventory.objects.select_for_update().get(product=self.product)

                if inventory.stock_quantity < self.quantity:
                    raise ValueError("Không đủ hàng trong kho")

                # trừ bằng F expression
                inventory.stock_quantity = F("stock_quantity") - self.quantity
                inventory.save(update_fields=["stock_quantity", "updated_at"])

            super().save(*args, **kwargs)

    def __str__(self):
        return f"Stock Out - {self.product.name} ({self.quantity})"

# ==============================
# 7. CART
# ==============================

class Cart(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Cart - {self.user.username}"

class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    added_at = models.DateTimeField(auto_now_add=True)

    @property
    def subtotal(self):
        return self.quantity * self.product.price
    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["cart", "product"],
                name="unique_cart_product"
            )
        ]

    def __str__(self):
        return f"{self.product.name} x {self.quantity}"

# ==============================
# 8. ORDER
# ==============================

class Order(models.Model):
    class OrderStatus(TextChoices):
        PENDING = "PENDING", "Chờ xác nhận"
        CONFIRMED = "CONFIRMED", "Đã xác nhận"
        SHIPPED = "SHIPPED", "Đang giao hàng"
        COMPLETED = "COMPLETED", "Hoàn thành"
        CANCELLED = "CANCELLED", "Đã hủy"

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    total_price = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    status = models.CharField(
        max_length=20,
        choices=OrderStatus.choices,
        default=OrderStatus.PENDING,
        db_index=True
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["created_at"]),
        ]

    def calculate_total(self):
        total = self.items.aggregate(
            total=Sum(F("quantity") * F("price"))
        )["total"] or 0

        self.total_price = total
        self.save(update_fields=["total_price"])

    def __str__(self):
        return f"Order #{self.id}"

class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    price = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["order", "product"],
                name="unique_product_per_order"
            )
        ]

    def subtotal(self):
        return self.quantity * self.price

    def __str__(self):
        return f"{self.product.name} x {self.quantity}"

# ==============================
# 9. PAYMENT
# ==============================

class Payment(models.Model):
    class PaymentMethod(TextChoices):
        CARD = "CARD", "Thẻ ngân hàng"
        CASH = "CASH", "Tiền mặt"

    class PaymentStatus(TextChoices):
        PENDING = "PENDING", "Pending"
        SUCCESS = "SUCCESS", "Success"
        FAILED = "FAILED", "Failed"

    order = models.OneToOneField(Order, on_delete=models.CASCADE)
    method = models.CharField(max_length=20, choices=PaymentMethod.choices)
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    status = models.CharField(
        max_length=20,
        choices=PaymentStatus.choices,
        default=PaymentStatus.PENDING
    )
    paid_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Payment for Order #{self.order.id}"

# ==============================
# 10. INVOICE
# ==============================

class Invoice(models.Model):
    order = models.OneToOneField(Order, on_delete=models.CASCADE)
    invoice_number = models.CharField(max_length=50, unique=True)
    issued_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    issued_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Invoice {self.invoice_number}"

# ==============================
# 11. REVIEW
# ==============================

class Review(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)

    rating = models.IntegerField(
        choices=[
            (1, "1 star"),
            (2, "2 stars"),
            (3, "3 stars"),
            (4, "4 stars"),
            (5, "5 stars"),
        ],
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )

    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user", "product"],
                name="unique_review_per_user_product"
            )
        ]

    def __str__(self):
        return f"Review - {self.product.name}"

# ==============================
# 12. REVENUE REPORT (Snapshot)
# ==============================

class RevenueReport(models.Model):
    date = models.DateField(unique=True)
    total_orders = models.PositiveIntegerField()
    total_revenue = models.DecimalField(max_digits=16, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-date"]

    def __str__(self):
        return f"Revenue {self.date}"

# ==============================
# 13. CHARGING STATION 
# ==============================

class ChargingStation(models.Model):
    class StationStatus(TextChoices):
        ACTIVE = "ACTIVE", "Hoạt động"
        MAINTENANCE = "MAINTENANCE", "Bảo trì"
        INACTIVE = "INACTIVE", "Ngừng hoạt động"

    class ChargerType(TextChoices):
        DC_FAST = "DC_FAST", "DC Fast"
        AC_SLOW = "AC_SLOW", "AC Slow"
        SUPERCHARGER = "SUPERCHARGER", "Supercharger"

    name = models.CharField(max_length=200)
    address = models.TextField()
    latitude = models.FloatField()
    longitude = models.FloatField()
    charger_type = models.CharField(
        max_length=20,
        choices=ChargerType.choices,
        default=ChargerType.DC_FAST
    )
    power = models.CharField(max_length=20, default='50kW')
    total_ports = models.PositiveIntegerField(default=0)
    available_ports = models.PositiveIntegerField(default=0)
    status = models.CharField(
        max_length=20,
        choices=StationStatus.choices,
        default=StationStatus.ACTIVE
    )
    image = models.ImageField(upload_to='stations/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.name

# ==============================
# 14. SEARCH HISTORY
# ==============================
class SearchHistory(models.Model):
    user = models.ForeignKey(
        User, on_delete=models.CASCADE,
        null=True, blank=True
    )
    query = models.CharField(max_length=300)
    display_name = models.TextField(blank=True)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    image_url = models.URLField(max_length=500, blank=True)
    searched_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-searched_at']

    def __str__(self):
        return f"{self.query} - {self.searched_at}"
