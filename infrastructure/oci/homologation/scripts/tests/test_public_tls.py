"""Offline security and expiry regressions; no traffic reaches homologation."""

from contextlib import redirect_stdout
from datetime import datetime, timedelta, timezone
import importlib.util
import io
import json
from pathlib import Path
import ssl
import unittest
from unittest.mock import patch

SPEC = importlib.util.spec_from_file_location(
    "check_public_tls", Path(__file__).parents[1] / "check_public_tls.py"
)
tls = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(tls)


class PublicTlsTests(unittest.TestCase):
    def test_rejects_unsafe_targets_without_network(self):
        for target in (
            "http://example.test", "https://user:secret@example.test",
            "https://example.test:8443", "https://example.test/login",
            "https://example.test?token=secret", "https://example.test/#secret",
            "https://example.test\\evil", "https://example.test\n", "https://",
        ):
            with self.subTest(target=target), self.assertRaises(tls.ProbeError):
                tls.parse_target(target)

    def test_accepts_only_https_origin(self):
        self.assertEqual("example.test", tls.parse_target("https://example.test:443/"))

    def test_alert_boundaries(self):
        now = datetime(2026, 1, 1, tzinfo=timezone.utc)
        for days, state, code in (
            (31, "ok", 0), (30, "warning", 1), (15, "warning", 1),
            (14, "urgent", 2), (8, "urgent", 2), (7, "critical", 3),
            (0, "critical", 3), (-1, "critical", 3),
        ):
            self.assertEqual((state, code, days), tls.expiry_state(now + timedelta(days=days), now))

    def test_key_logging_is_rejected_before_handshake(self):
        with patch.dict(tls.os.environ, {"SSLKEYLOGFILE": "private.log"}), \
                patch.object(tls.http.client, "HTTPSConnection") as client:
            with self.assertRaisesRegex(tls.ProbeError, "tls_key_logging_not_allowed"):
                tls.probe("example.test")
            client.assert_not_called()

    def configure_connection(self, client, body=b'{"status":"Healthy"}', status=200):
        connection = client.return_value
        connection.sock.getpeercert.return_value = {"notAfter": "Jan 24 00:00:00 2030 GMT"}
        connection.sock.version.return_value = "TLSv1.3"
        response = connection.getresponse.return_value
        response.status = status
        response.read.return_value = body
        return connection

    @patch.dict(tls.os.environ, {}, clear=True)
    @patch.object(tls.http.client, "HTTPSConnection")
    def test_validates_certificate_and_readiness_on_same_connection(self, client):
        connection = self.configure_connection(client)
        result, code = tls.probe("example.test")
        context = client.call_args.kwargs["context"]
        self.assertTrue(context.check_hostname)
        self.assertEqual(ssl.CERT_REQUIRED, context.verify_mode)
        self.assertEqual(ssl.TLSVersion.TLSv1_2, context.minimum_version)
        self.assertEqual(0, code)
        self.assertEqual(200, result["readiness_status"])
        self.assertNotIn("example.test", json.dumps(result))
        connection.request.assert_called_once_with(
            "GET", "/api/health/ready", headers={"Accept": "application/json"}
        )
        connection.close.assert_called_once()

    @patch.dict(tls.os.environ, {}, clear=True)
    @patch.object(tls.http.client, "HTTPSConnection")
    def test_redirect_is_failure_and_is_not_followed(self, client):
        connection = self.configure_connection(client, status=302)
        with self.assertRaisesRegex(tls.ProbeError, "readiness_http_failed"):
            tls.probe("example.test")
        self.assertEqual(1, connection.request.call_count)
        connection.close.assert_called_once()

    @patch.dict(tls.os.environ, {}, clear=True)
    @patch.object(tls.http.client, "HTTPSConnection")
    def test_rejects_unhealthy_invalid_or_oversized_body(self, client):
        for body in (b'{"status":"Unhealthy"}', b"not json", b"[]", b"x" * 16385):
            self.configure_connection(client, body)
            with self.subTest(body_length=len(body)), self.assertRaises(tls.ProbeError):
                tls.probe("example.test")

    @patch.dict(tls.os.environ, {}, clear=True)
    @patch.object(tls.http.client, "HTTPSConnection")
    def test_certificate_failure_is_sanitized(self, client):
        client.return_value.connect.side_effect = ssl.SSLCertVerificationError("private detail")
        output = io.StringIO()
        with redirect_stdout(output):
            code = tls.main(["--origin", "https://example.test"])
        self.assertEqual(4, code)
        self.assertEqual({"state": "failed", "reason": "certificate_validation_failed"},
                         json.loads(output.getvalue()))
        self.assertNotIn("private detail", output.getvalue())


if __name__ == "__main__":
    unittest.main()
