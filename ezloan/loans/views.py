from pathlib import PurePosixPath

from django.http import Http404
from django.shortcuts import redirect, render
from django.template import TemplateDoesNotExist
from django.template.loader import get_template


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
