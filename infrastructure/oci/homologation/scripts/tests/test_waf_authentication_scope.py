"""Execute the deployed JMESPath condition against authentication request cases.

OCI's documented case-insensitive functions are supplied explicitly; this does
not emulate WAF counters or replace validation by the regional OCI service.
"""

import pathlib
import re
import unittest

import jmespath
from jmespath import functions


class OracleFunctions(functions.Functions):
    @functions.signature({"types": ["array", "string"]}, {"types": ["string"]})
    def _func_i_contains(self, subject, search):
        if isinstance(subject, str):
            return search.lower() in subject.lower()
        return any(isinstance(item, str) and item.lower() == search.lower() for item in subject)

    @functions.signature({"types": ["string"]}, {"types": ["string"]})
    def _func_i_equals(self, left, right):
        return left.lower() == right.lower()


class AuthenticationScopeTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        source = pathlib.Path(__file__).resolve().parents[2] / "terraform" / "edge-waf.tf"
        rule = re.split(r'name\s*=\s*"authentication-per-source"', source.read_text(encoding="utf-8"), maxsplit=1)[1]
        cls.expression = re.search(r'condition\s*=\s*"([^"]+)"', rule).group(1)
        cls.compiled = jmespath.compile(cls.expression)
        cls.options = jmespath.Options(custom_functions=OracleFunctions())

    def matches(self, method, path):
        request = {"http": {"request": {"method": method, "url": {"path": path}}}}
        return self.compiled.search(request, options=self.options)

    def test_interactive_attempts_and_callbacks_remain_limited(self):
        cases = {
            "POST": ["/api/auth/login", "/api/auth/login/", "/signin-google"],
            "GET": [
                "/api/auth/google/start", "/api/auth/google/start/",
                "/api/auth/google/complete", "/api/auth/google/complete/",
                "/auth/google/complete", "/signin-google",
            ],
        }
        for method, paths in cases.items():
            for path in paths:
                for variant in (path, path.upper()):
                    with self.subTest(method=method, path=variant):
                        self.assertIs(self.matches(method, variant), True)

    def test_session_lifecycle_and_unrelated_requests_do_not_consume_login_quota(self):
        cases = [
            ("GET", "/api/auth/providers"), ("GET", "/api/auth/providers/"),
            ("GET", "/api/auth/csrf"), ("POST", "/api/auth/refresh"),
            ("POST", "/api/auth/logout"), ("GET", "/api/auth/login"),
            ("POST", "/api/auth/google/start"), ("POST", "/api/auth/login-extra"),
            ("GET", "/api/auth/google/start-extra"), ("GET", "/api/access-records"),
            ("GET", "/health/ready"), ("OPTIONS", "/api/auth/login"),
            ("DELETE", "/signin-google"),
        ]
        for method, path in cases:
            with self.subTest(method=method, path=path):
                self.assertIs(self.matches(method, path), False)

    def test_expression_fits_oci_condition_limit(self):
        self.assertLessEqual(len(self.expression), 1024)


if __name__ == "__main__":
    unittest.main()
