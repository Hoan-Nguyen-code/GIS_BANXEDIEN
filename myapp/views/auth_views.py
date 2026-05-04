from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.utils.http import urlsafe_base64_encode
from django.conf import settings
from django.template.loader import render_to_string
from django.core.mail import send_mail
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_decode
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


def forget_password(request):
    """
    View xử lý quên mật khẩu: Nhập email và gửi hướng dẫn đặt lại mật khẩu.
    """
    if request.method == 'POST':
        email = request.POST.get('email')  # Nhận email từ form

        # Kiểm tra xem email có tồn tại trong hệ thống không
        try:
            user = User.objects.get(email=email)  # Sử dụng myapp.User thay vì auth.User
        except User.DoesNotExist:
            messages.error(request, 'Email không tồn tại trong hệ thống!')
            return render(request, 'login/forget_password.html')  # Nếu không có email, hiển thị lại form

        # Tạo token và liên kết reset mật khẩu
        token = default_token_generator.make_token(user)
        
        # Chuyển user.pk thành chuỗi và mã hóa
        uid = urlsafe_base64_encode(str(user.pk).encode())  # Đảm bảo chuyển user.pk thành chuỗi trước khi encode

        # Tạo liên kết reset mật khẩu
        reset_link = f"{settings.SITE_URL}/reset/{uid}/{token}/"

        # Gửi email cho người dùng
        subject = "Yêu cầu đặt lại mật khẩu"
        message = render_to_string('login/password_reset_email.html', {
            'user': user,
            'reset_link': reset_link
        })

        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [email],
            fail_silently=False,
        )

        messages.success(request, 'Hướng dẫn đặt lại mật khẩu đã được gửi tới email của bạn.')
        return redirect('login')  # Sau khi gửi email, chuyển người dùng về trang đăng nhập.
    
    return render(request, 'login/forget_password.html')

# myapp/views/auth_views.py


def password_reset_confirm(request, uidb64, token):
    """
    Xử lý việc người dùng nhập mật khẩu mới sau khi nhấp vào liên kết reset mật khẩu.
    """
    try:
        # Giải mã uid từ base64 và tìm user
        uid = urlsafe_base64_decode(uidb64).decode()
        user = User.objects.get(pk=uid)
    except (User.DoesNotExist, ValueError, TypeError):
        messages.error(request, 'Liên kết không hợp lệ!')
        return redirect('login')

    # Kiểm tra token reset mật khẩu
    if not default_token_generator.check_token(user, token):
        messages.error(request, 'Liên kết đã hết hạn hoặc không hợp lệ!')
        return redirect('login')

    if request.method == 'POST':
        new_password = request.POST.get('new_password')
        confirm_password = request.POST.get('confirm_password')

        # Kiểm tra xem mật khẩu mới và xác nhận mật khẩu có khớp không
        if new_password != confirm_password:
            messages.error(request, 'Mật khẩu mới và xác nhận mật khẩu không khớp!')
            return render(request, 'login/password_reset_form.html', {'user': user})

        # Cập nhật mật khẩu mới
        user.set_password(new_password)
        user.save()

        messages.success(request, 'Mật khẩu của bạn đã được thay đổi thành công!')
        return redirect('login')  # Sau khi đổi mật khẩu, chuyển về trang đăng nhập

    return render(request, 'login/password_reset_form.html', {'user': user})
