from django.contrib import admin

from .models import UserRecord


@admin.register(UserRecord)
class UserRecordAdmin(admin.ModelAdmin):
    list_display = ('email', 'display_name', 'updated_at', 'created_at')
    search_fields = ('email', 'data')
    readonly_fields = ('created_at', 'updated_at')

    @admin.display(description='Name')
    def display_name(self, obj):
        return (obj.data or {}).get('name', '')


admin.site.site_header = 'Easy Loan Administration'
admin.site.site_title = 'Easy Loan Admin'
admin.site.index_title = 'Easy Loan Control Center'
admin.site.login_template = 'django_admin/login.html'
