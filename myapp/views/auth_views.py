from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from myapp.models import User

def login_view(request):
    """
    View xử lý đăng nhập
    """

    # Nếu user đã đăng nhập
    if request.user.is_authenticated:
        if request.user.role == User.Role.ADMIN:  # ✅ Sửa chỗ 1
            return redirect('admin_dashboard')
        return redirect('home')

    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        remember = request.POST.get('remember')

        user = authenticate(request, username=username, password=password)

        if user is not None:
            login(request, user)

            # Ghi nhớ đăng nhập
            if not remember:
                request.session.set_expiry(0)
            else:
                request.session.set_expiry(1209600)

            # 👉 PHÂN LUỒNG ADMIN / USER
            if user.role == User.Role.ADMIN:  # ✅ Sửa chỗ 2
                return redirect('admin_dashboard')

            messages.success(request, f'Chào mừng {user.username}!')
            return redirect('home')

        else:
            messages.error(request, 'Tên đăng nhập hoặc mật khẩu không đúng!')

    return render(request, 'login/login.html')


def register_view(request):
    """
    View xử lý đăng ký tài khoản mới
    """
    # Nếu user đã đăng nhập, chuyển về trang home
    if request.user.is_authenticated:
        return redirect('home')
    
    # Xử lý khi user submit form
    if request.method == 'POST':
        username = request.POST.get('username')
        email = request.POST.get('email')
        password1 = request.POST.get('password1')
        password2 = request.POST.get('password2')
        
        # Validation
        errors = []
        
        # Kiểm tra username đã tồn tại chưa
        if User.objects.filter(username=username).exists():
            errors.append('Tên đăng nhập đã tồn tại!')
        
        # Kiểm tra email đã tồn tại chưa
        if User.objects.filter(email=email).exists():
            errors.append('Email đã được sử dụng!')
        
        # Kiểm tra mật khẩu khớp
        if password1 != password2:
            errors.append('Mật khẩu không khớp!')
        
        # Kiểm tra độ dài mật khẩu
        if len(password1) < 8:
            errors.append('Mật khẩu phải có ít nhất 8 ký tự!')
        
        # Kiểm tra username hợp lệ
        if len(username) < 3:
            errors.append('Tên đăng nhập phải có ít nhất 3 ký tự!')
        
        # Nếu có lỗi, hiển thị thông báo
        if errors:
            for error in errors:
                messages.error(request, error)
        else:
            # Tạo user mới - mặc định role CUSTOMER
            try:
                user = User.objects.create_user(
                    username=username,
                    email=email,
                    password=password1,
                    role=User.Role.CUSTOMER  # ✅ Rõ ràng là CUSTOMER
                )
                messages.success(request, 'Đăng ký thành công! Vui lòng đăng nhập.')
                return redirect('login')
            except Exception as e:
                messages.error(request, f'Có lỗi xảy ra: {str(e)}')
    
    # Hiển thị form đăng ký
    return render(request, 'login/register.html')


# ✅ Sửa chỗ 3: Xóa 2 hàm thừa admin_dashboard_view và home_view


def logout_view(request):
    """
    View xử lý đăng xuất
    """
    logout(request)
    messages.success(request, 'Bạn đã đăng xuất thành công!')
    return redirect('home')