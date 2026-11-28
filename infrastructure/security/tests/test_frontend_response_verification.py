"""Exercise the bounded HTTP probe against a real loopback fixture, not the site."""
from contextlib import contextmanager
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import importlib.util
from pathlib import Path
from threading import Thread
import unittest

spec = importlib.util.spec_from_file_location("frontend_probe", Path(__file__).resolve().parents[1] / "verify_frontend_responses.py")
probe = importlib.util.module_from_spec(spec)
spec.loader.exec_module(probe)


@contextmanager
def fixture(policies):
    class Handler(BaseHTTPRequestHandler):
        def respond(self):
            path = self.path
            missing = path == "/assets/qa-absent-00000000.js"
            self.send_response(308 if path == "/api" else 404 if missing else 200)
            self.send_header("X-Frame-Options", "DENY")
            for value in policies:
                self.send_header("Referrer-Policy", value)
            if path == "/api":
                self.send_header("Location", "/api/")
            elif path == "/api/auth/csrf":
                self.send_header("Cache-Control", "no-store")
            elif path == "/login":
                self.send_header("Cache-Control", "no-cache")
            elif path == "/assets/index-fixture123.js":
                self.send_header("Cache-Control", "public, max-age=31536000, immutable")
            self.end_headers()
            if self.command == "GET":
                self.wfile.write(b'<div id="root"></div><script src="/assets/index-fixture123.js"></script>' if path == "/login" else b"{}")

        do_GET = respond
        do_HEAD = respond

        def log_message(self, *_args):
            pass

    server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
    thread = Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        yield "http://127.0.0.1:" + str(server.server_port)
    finally:
        server.shutdown()
        server.server_close()
        thread.join(timeout=2)


class ReferrerVerificationTests(unittest.TestCase):
    def test_canonical_policy_passes_all_probe_routes(self):
        with fixture(["no-referrer"]) as origin:
            probe.verify(origin)

    def test_missing_policy_fails_instead_of_silently_passing(self):
        with fixture([]) as origin, self.assertRaisesRegex(ValueError, "no-referrer"):
            probe.verify(origin)

    def test_divergent_edge_policy_is_detected(self):
        with fixture(["strict-origin-when-cross-origin"]) as origin, self.assertRaisesRegex(ValueError, "no-referrer"):
            probe.verify(origin)

    def test_duplicate_policies_are_rejected(self):
        with fixture(["no-referrer", "no-referrer"]) as origin, self.assertRaisesRegex(ValueError, "exactly one"):
            probe.verify(origin)


if __name__ == "__main__":
    unittest.main()
