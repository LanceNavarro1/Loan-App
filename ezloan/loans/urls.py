from django.urls import path

from . import views

urlpatterns = [
    path('', views.landing, name='landing'),
    path('landing.html', views.landing, name='landing_html'),
    path('login.html', views.login_view, name='login'),
    path('register.html', views.register, name='register'),
    path('logout.html', views.logout_view, name='logout'),
    path('user/<slug:page>.html', views.user_page, name='user_page'),
]
