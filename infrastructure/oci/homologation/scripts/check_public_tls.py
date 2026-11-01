"""Read-only HTTPS readiness and certificate-expiry probe (Python 3.11+)."""

import argparse
from datetime import datetime, timezone
import http.client
import json
import math
import os
import ssl
from urllib.parse import urlsplit


class ProbeError(Exception):
    """A fixed, publishable failure code without response or configuration data."""


def parse_target(value):
    try:
        target = urlsplit(value)
        if (
            target.scheme != "https"
            or not target.hostname
            or target.username is not None
            or target.password is not None
            or target.port not in (None, 443)
            or target.path not in ("", "/")
            or target.query
            or target.fragment
            or any(character.isspace() or ord(character) < 32 for character in value)
            or "\\" in value
        ):
            raise ValueError()
        target.hostname.encode("ascii")
        return target.hostname
    except (ValueError, UnicodeError):
        raise ProbeError("invalid_https_origin") from None


def expiry_state(expires_at, now):
    remaining = (expires_at - now).total_seconds()
    for days, state, code in ((7, "critical", 3), (14, "urgent", 2), (30, "warning", 1)):
        if remaining <= days * 86400:
            return state, code, math.floor(remaining / 86400)
    return "ok", 0, math.floor(remaining / 86400)


def probe(hostname, timeout=10):
    # create_default_context honors SSLKEYLOGFILE; refuse it before any handshake.
    if os.environ.get("SSLKEYLOGFILE"):
        raise ProbeError("tls_key_logging_not_allowed")
    context = ssl.create_default_context()
    context.minimum_version = ssl.TLSVersion.TLSv1_2
    context.set_alpn_protocols(["http/1.1"])
    connection = http.client.HTTPSConnection(hostname, timeout=timeout, context=context)
    try:
        connection.connect()
        certificate = connection.sock.getpeercert()
        expires_at = datetime.fromtimestamp(
            ssl.cert_time_to_seconds(certificate["notAfter"]), timezone.utc
        )
        tls_version = connection.sock.version()
        connection.request(
            "GET", "/api/health/ready", headers={"Accept": "application/json"}
        )
        response = connection.getresponse()
        if response.status != 200:
            raise ProbeError("readiness_http_failed")
        # Do not follow redirects, save cookies, or print the response body.
        body = response.read(16385)
        if len(body) > 16384:
            raise ProbeError("readiness_response_too_large")
        try:
            healthy = json.loads(body).get("status") == "Healthy"
        except (ValueError, AttributeError, UnicodeError):
            healthy = False
        if not healthy:
            raise ProbeError("readiness_contract_failed")
        now = datetime.now(timezone.utc)
        state, code, days = expiry_state(expires_at, now)
        return {
            "checked_at_utc": now.isoformat(),
            "certificate_expires_at_utc": expires_at.isoformat(),
            "days_remaining": days,
            "tls_version": tls_version,
            "readiness_status": 200,
            "state": state,
        }, code
    except ssl.SSLCertVerificationError:
        raise ProbeError("certificate_validation_failed") from None
    except (OSError, ssl.SSLError, http.client.HTTPException):
        raise ProbeError("https_connection_failed") from None
    except (KeyError, TypeError, OverflowError):
        raise ProbeError("certificate_metadata_failed") from None
    finally:
        connection.close()


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--origin", required=True, help="Approved HTTPS origin, without path")
    arguments = parser.parse_args(argv)
    try:
        result, code = probe(parse_target(arguments.origin))
    except ProbeError as error:
        result, code = {"state": "failed", "reason": str(error)}, 4
    print(json.dumps(result, sort_keys=True))
    return code


if __name__ == "__main__":
    raise SystemExit(main())
