from django.shortcuts import render
from django.contrib.auth.decorators import login_required

@login_required
def home(request):
    """
    View cho trang chủ sau khi đăng nhập
    """
    context = {
        'user': request.user,
    }
    return render(request, 'login/home.html', context)