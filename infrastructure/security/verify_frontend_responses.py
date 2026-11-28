"""Verify redirect, frame and cache responses through the running frontend."""

import argparse
import re
from urllib.error import HTTPError
from urllib.parse import urlparse
from urllib.request import HTTPRedirectHandler, Request, build_opener


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, request, response, code, message, headers, new_url):
        return None


def verify(base_url):
    parsed = urlparse(base_url)
    if parsed.scheme not in ("http", "https") or not parsed.netloc or parsed.username or parsed.password:
        raise ValueError("Expected an HTTP(S) frontend origin without credentials")
    opener = build_opener(NoRedirect())
    failures = []

    def fetch(path, method="GET"):
        request = Request(base_url.rstrip("/") + path, method=method)
        try:
            response = opener.open(request, timeout=15)
        except HTTPError as error:
            response = error
        with response:
            body = response.read(65537)
            if len(body) > 65536:
                raise ValueError("Response exceeded the bounded verification size")
            return response.status, response.headers, body

    def require(condition, message):
        if not condition:
            failures.append(message)

    status, headers, _ = fetch("/api")
    require(status == 308 and headers.get("Location") == "/api/",
            "API root must redirect relatively to /api/")

    status, headers, _ = fetch("/api/auth/csrf")
    require(status == 200, "CSRF endpoint must remain reachable")
    require(headers.get_all("X-Frame-Options", []) == ["DENY"],
            "CSRF response must contain exactly one DENY frame policy")
    require("no-store" in headers.get("Cache-Control", ""),
            "CSRF response must retain no-store")

    status, headers, body = fetch("/login")
    require(status == 200 and b'<div id="root"></div>' in body,
            "SPA login must remain reachable")
    require("no-cache" in headers.get("Cache-Control", ""),
            "SPA HTML must require revalidation")
    require(headers.get_all("X-Frame-Options", []) == ["DENY"],
            "SPA HTML must retain its frame policy")
    script = re.search(rb'<script[^>]*src="(/assets/[A-Za-z0-9._-]+\.js)"', body)
    require(script is not None, "SPA HTML must identify a versioned script")
    if script is not None:
        status, headers, _ = fetch(script[1].decode("ascii"), "HEAD")
        cache = headers.get("Cache-Control", "")
        require(status == 200 and "immutable" in cache and "max-age=31536000" in cache,
                "Hashed script must receive long-lived immutable caching")
        require(headers.get_all("X-Frame-Options", []) == ["DENY"],
                "Static script must retain security headers")

    status, headers, _ = fetch("/assets/qa-absent-00000000.js", "HEAD")
    require(status == 404 and "immutable" not in headers.get("Cache-Control", ""),
            "Missing static resources must return 404 without immutable caching")
    if failures:
        raise ValueError("; ".join(failures))
    print("Frontend redirect, frame, cache and missing-resource verification passed")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("base_url")
    arguments = parser.parse_args()
    try:
        verify(arguments.base_url)
    except (OSError, ValueError) as error:
        # Print only controlled validation messages, never response bodies or cookies.
        parser.exit(1, "Frontend verification failed (" + type(error).__name__ + ")\n"
                    + (str(error) + "\n" if isinstance(error, ValueError) else ""))
