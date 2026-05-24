from django.urls import path, re_path

from . import views

app_name = 'loans'

urlpatterns = [
    path('', views.landing, name='landing'),
    path('landing.html', views.landing, name='landing_html'),
    path('login.html', views.login_view, name='login'),
    path('register.html', views.register, name='register'),
    path('logout.html', views.logout_view, name='logout'),
    path('user/<path:page>', views.user_page, name='user_page'),
    path('admin/', views.folder_page_redirect, {'folder': 'admin', 'page': 'index.html'}, name='admin_index'),
    path('admin/login/', views.folder_page_redirect, {'folder': 'admin', 'page': 'login.html'}, name='admin_login'),
    path('admin/logout/', views.folder_page_redirect, {'folder': 'admin', 'page': 'logout.html'}, name='admin_logout'),
    path('Admin/', views.folder_page, {'folder': 'Admin'}, name='admin_index_upper'),
    path('Admin/<path:page>', views.folder_page, {'folder': 'Admin'}, name='admin_page_upper'),
    re_path(r'^admin/(?P<page>.+\.html)$', views.folder_page, {'folder': 'admin'}, name='admin_page'),
    path('customer support page/<path:page>', views.folder_page, {'folder': 'customer support page'}, name='support_page'),
    path('notifications/<path:page>', views.folder_page, {'folder': 'notifications'}, name='notifications_page'),
    path('security page/<path:page>', views.folder_page, {'folder': 'security page'}, name='security_page'),
    path('settings/<path:page>', views.folder_page, {'folder': 'settings'}, name='settings_page'),
    path('staff and admin management/<path:page>', views.folder_page, {'folder': 'staff and admin management'}, name='staff_page'),
]
