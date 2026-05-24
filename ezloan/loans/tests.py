from django.test import SimpleTestCase


class PageRouteTests(SimpleTestCase):
    def test_root_pages_render(self):
        paths = [
            '/',
            '/landing.html',
            '/login.html',
            '/register.html',
            '/logout.html',
        ]

        for path in paths:
            with self.subTest(path=path):
                self.assertEqual(self.client.get(path).status_code, 200)

    def test_generated_sections_render(self):
        paths = [
            '/Admin/dashboard.html',
            '/admin/dashboard.html',
            '/admin/login.html',
            '/Admin/user%20management/users.html',
            '/Admin/loan%20application%20page/loan-applications.html',
            '/admin/customer%20support%20page/support-tickets.html',
            '/admin/security%20page/security-settings.html',
            '/settings/settings.html',
            '/admin/staff%20and%20admin%20management/staff.html',
        ]

        for path in paths:
            with self.subTest(path=path):
                self.assertEqual(self.client.get(path).status_code, 200)

    def test_nested_user_pages_render(self):
        paths = [
            '/user/dashboard.html',
            '/user/apply-loan.html',
            '/user/loans.html',
            '/user/loan-details.html',
            '/user/loan-status.html',
            '/user/documents.html',
            '/user/payments.html',
            '/user/auth/login.html',
            '/user/docs/documents.html',
            '/user/loans/loan-history.html',
            '/user/payments/upload-payment.html',
            '/user/profile/change-password.html',
            '/user/support/ticket.html',
        ]

        for path in paths:
            with self.subTest(path=path):
                self.assertEqual(self.client.get(path).status_code, 200)

    def test_unsafe_template_paths_are_not_rendered(self):
        paths = [
            '/user/../landing.html',
            '/Admin/../landing.html',
            '/user/dashboard.txt',
        ]

        for path in paths:
            with self.subTest(path=path):
                self.assertEqual(self.client.get(path).status_code, 404)

    def test_django_admin_routes_are_not_captured_by_custom_admin_pages(self):
        response = self.client.get('/admin/login/?next=/admin/')
        self.assertEqual(response.status_code, 302)
        self.assertEqual(response.url, '/admin/login.html?next=/admin/')
