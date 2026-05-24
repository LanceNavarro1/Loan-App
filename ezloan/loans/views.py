from pathlib import PurePosixPath
import json

from django.conf import settings
from django.http import FileResponse
from django.http import Http404, JsonResponse
from django.shortcuts import redirect, render
from django.template import TemplateDoesNotExist
from django.template.loader import get_template
from django.views.decorators.csrf import csrf_exempt

from .models import UserRecord


TEMPLATE_FOLDER_ALIASES = {
    'admin': 'admin',
    'Admin': 'admin',
    'customer support page': 'customer support page',
    'notifications': 'notifications',
    'security page': 'security page',
    'settings': 'settings',
    'staff and admin management': 'staff and admin management',
}

USER_PAGE_ALIASES = {
    'apply-loan.html': 'loans/apply-loan.html',
    'loans.html': 'loans/loans.html',
    'loan-details.html': 'loans/loan-details.html',
    'loan-status.html': 'loans/loan-status.html',
    'loan-form.html': 'loans/loan-form.html',
    'loan-history.html': 'loans/loan-history.html',
    'documents.html': 'docs/documents.html',
    'erification-status.html': 'docs/erification-status.html',
    'payments.html': 'payments/payments.html',
    'payment-history.html': 'payments/payment-history.html',
    'receipts.html': 'payments/receipts.html',
    'upload-payment.html': 'payments/upload-payment.html',
    'edit-profile.html': 'profile/edit-profile.html',
    'change-password.html': 'profile/change-password.html',
    'security-settings.html': 'profile/security-settings.html',
    'support.html': 'support/support.html',
    'faq.html': 'support/faq.html',
    'live-chat.html': 'support/live-chat.html',
    'ticket.html': 'support/ticket.html',
}


def _template_exists(template_name):
    try:
        get_template(template_name)
    except TemplateDoesNotExist:
        return False

    return True


def _safe_html_path(page):
    normalized_page = PurePosixPath(page.replace('\\', '/'))

    if normalized_page.is_absolute() or '..' in normalized_page.parts or normalized_page.suffix != '.html':
        raise Http404("Page not found")

    return normalized_page.as_posix()


def _render_html(request, template_name):
    if not _template_exists(template_name):
        raise Http404("Page not found")

    return render(request, template_name)


def folder_page(request, folder, page='index.html'):
    template_folder = TEMPLATE_FOLDER_ALIASES.get(folder)

    if not template_folder:
        raise Http404("Page not found")

    return _render_html(request, f"{template_folder}/{_safe_html_path(page)}")


def folder_page_redirect(request, folder, page='index.html'):
    template_folder = TEMPLATE_FOLDER_ALIASES.get(folder)

    if not template_folder:
        raise Http404("Page not found")

    safe_page = _safe_html_path(page)
    query_string = request.META.get('QUERY_STRING', '')
    target = f"/{template_folder}/{safe_page}"
    return redirect(f"{target}?{query_string}" if query_string else target)


def landing(request):
    return render(request, 'landing.html')


def login_view(request):
    return render(request, 'user/auth/login.html')


def register(request):
    return render(request, 'user/auth/register.html')


def logout_view(request):
    return render(request, 'user/auth/logout.html')


def user_page(request, page):
    safe_page = _safe_html_path(page)
    return _render_html(request, f"user/{USER_PAGE_ALIASES.get(safe_page, safe_page)}")


def app_icon(request):
    icon_path = settings.PROJECT_ROOT / 'static' / 'easy-loan-icon.svg'

    if not icon_path.exists():
        raise Http404("Icon not found")

    return FileResponse(icon_path.open('rb'), content_type='image/svg+xml')


def _records_as_store():
    return {
        record.email: {
            **(record.data or {}),
            'email': record.email,
        }
        for record in UserRecord.objects.all()
    }


@csrf_exempt
def user_store_api(request):
    if request.method == 'GET':
        return JsonResponse({'users': _records_as_store()})

    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    try:
        payload = json.loads(request.body.decode('utf-8') or '{}')
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)

    users = payload.get('users')
    if not isinstance(users, dict):
        return JsonResponse({'error': 'users must be an object'}, status=400)

    incoming_emails = set()
    for raw_email, user_data in users.items():
        if not isinstance(user_data, dict):
            continue

        email = str(user_data.get('email') or raw_email).strip().lower()
        if not email:
            continue

        incoming_emails.add(email)
        normalized_data = {**user_data, 'email': email}
        UserRecord.objects.update_or_create(
            email=email,
            defaults={'data': normalized_data},
        )

    if payload.get('replace') is True:
        UserRecord.objects.exclude(email__in=incoming_emails).delete()

    return JsonResponse({'users': _records_as_store()})
