from django.shortcuts import render

def landing(request):
    return render(request, 'landing.html')


def login_view(request):
    return render(request, 'login.html')


def register(request):
    return render(request, 'register.html')


def logout_view(request):
    return render(request, 'logout.html')


def user_page(request, page):
    allowed_pages = {
        'dashboard',
        'apply-loan',
        'loans',
        'payments',
        'schedule',
        'notifications',
        'notification',
        'profile',
        'settings',
        'loan-details',
    }

    if page not in allowed_pages:
        page = 'dashboard'

    return render(request, f'user/{page}.html')
