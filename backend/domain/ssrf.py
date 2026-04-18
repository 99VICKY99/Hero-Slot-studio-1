"""SSRF guard.

Resolves the hostname to an IP and rejects anything that is not a
routable public address. Also enforces http(s) scheme. Runs at the
route layer before the scraper ever touches the URL.
"""

from __future__ import annotations

import ipaddress
import socket
from urllib.parse import urlparse

_ALLOWED_SCHEMES = frozenset({"http", "https"})


def _resolve_ip(host: str) -> ipaddress.IPv4Address | ipaddress.IPv6Address | None:
    """Resolve host to an IP. Returns None on any lookup/parse failure."""
    try:
        resolved = socket.gethostbyname(host)
    except (socket.gaierror, UnicodeError, OSError):
        return None
    try:
        return ipaddress.ip_address(resolved)
    except ValueError:
        return None


def _is_forbidden_ip(ip: ipaddress.IPv4Address | ipaddress.IPv6Address) -> bool:
    """Return True if this IP must not be contacted from a public-facing scraper."""
    if ip.is_loopback:
        return True
    if ip.is_private:
        return True
    if ip.is_link_local:
        return True
    if ip.is_multicast:
        return True
    if ip.is_reserved:
        return True
    if ip.is_unspecified:
        return True
    return False


def is_safe_url(url: str) -> bool:
    """Return True only if `url` is a scrapable public http(s) address."""
    if not url or not isinstance(url, str):
        return False

    try:
        parsed = urlparse(url)
    except ValueError:
        return False

    if parsed.scheme.lower() not in _ALLOWED_SCHEMES:
        return False

    host = parsed.hostname
    if not host:
        return False

    ip = _resolve_ip(host)
    if ip is None:
        return False

    if _is_forbidden_ip(ip):
        return False

    return True
