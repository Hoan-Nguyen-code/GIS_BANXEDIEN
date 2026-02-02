from django.db import models

# Create your models here.

class TodoItem(models.Model):
    title = models.CharField(max_length=200)
    completed = models.BooleanField(default=False)
    
class Customer(models.Model):
    name = models.CharField(max_length=100) #ten
    email = models.EmailField(unique=True) #email
    phone = models.CharField(max_length=15) #sdt
    address = models.TextField(max_length=255) #dia chi
    created_at = models.DateTimeField(auto_now_add=True) #tg tao tk cua khach hang

    def __str__(self):
        return self.name
        

class ElectricBike(models.Model):
    name = models.CharField(max_length=100) #ten xe
    description = models.TextField() #mo ta xe
    price = models.DecimalField(max_digits=10, decimal_places=2) #gia xe
    stock_quantity = models.IntegerField() #so luong xe trong kho
    image = models.ImageField(upload_to='electric_bikes/') #hinh anh xe
            
    def __str__(self):
        return self.name
            
class Order(models.Model):
    customer = models.ForeignKey("Customer", on_delete=models.CASCADE) #khach hang dat xe
    total_price = models.DecimalField(max_digits=10, decimal_places=2) #tong gia tri don hang
    order_date = models.DateTimeField(auto_now_add=True) #tg dat hang
    status = models.CharField(max_length=50, default='Pending') #trang thai don hang

    def __str__(self):
        return f"Order {self.id} by {self.customer.name}"
        
    
class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')#lk don hang
    electric_bike = models.ForeignKey("ElectricBike", on_delete=models.CASCADE)#lk xe dien
    quantity = models.IntegerField()#sl xe trong don
    price = models.DecimalField(max_digits=10, decimal_places=2)#gia cua xe 

    def __str__(self):
        return f"{self.quantity} x {self.electric_bike.name} in Order {self.order.id}"

    
class Cart(models.Model):
    customer = models.ForeignKey("Customer", on_delete=models.CASCADE)#lk voi kh
    create_at = models.DateTimeField(auto_now_add=True)#tg tao gio hang

    def __str__(self):
        return f"Cart of {self.customer.name}"
        
class CartItem(models.Model):
    cart = models.ForeignKey("Cart", on_delete=models.CASCADE, related_name='items')#lk voi gio hang
    electric_bike = models.ForeignKey("ElectricBike", on_delete=models.CASCADE)#lk voi xe dien
    quantity = models.IntegerField()#sl xe trong gio hang
    added_at = models.DateTimeField(auto_now_add=True)#tg them xe vao gio hang

    def __str__(self):
        return f"{self.quantity} x {self.electric_bike.name} in Cart of {self.cart.customer.name}"
            
        
class Payment(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE)#lk voi don hang
    payment_method = models.CharField(max_length=50)#pp thanh toan
    payment_date = models.DateTimeField(auto_now_add=True)#tg thanh toan
    amount = models.DecimalField(max_digits=10, decimal_places=2)#so tien thanh toan
    status = models.CharField(max_length=50, default='Pending')#trang thai thanh toan

    def __str__(self):
        return f"Payment for Order {self.order.id} - {self.status}" 


class Review(models.Model):
    customer = models.ForeignKey("Customer", on_delete=models.CASCADE)#kh danh gia
    electric_bike = models.ForeignKey("ElectricBike", on_delete=models.CASCADE)#xe dc danh gia
    rating = models.IntegerField(choices=[(1, '1 star'), (2, '2 stars'), (3, '3 stars'), (4, '4 stars'), (5, '5 stars')])#danh gia sao
    comment = models.TextField()#binh luan
    created_at = models.DateTimeField(auto_now_add=True)#tg danh gia

    def __str__(self):
        return f"Review by {self.customer.name} for {self.electric_bike.name}" 