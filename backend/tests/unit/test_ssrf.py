"""Unit tests for the SSRF guard.

We monkeypatch `socket.gethostbyname` so the tests are deterministic
and offline — no DNS calls in CI.
"""

from __future__ import annotations

import pytest

from backend.domain import ssrf


@pytest.fixture(autouse=True)
def _patch_dns(monkeypatch: pytest.MonkeyPatch) -> None:
    """Default: every hostname resolves to a known public IP."""

    def fake_gethostbyname(host: str) -> str:
        return _HOSTNAME_TO_IP.get(host, "93.184.216.34")  # example.com

    monkeypatch.setattr("backend.domain.ssrf.socket.gethostbyname", fake_gethostbyname)


_HOSTNAME_TO_IP: dict[str, str] = {
    "example.com": "93.184.216.34",
    "loopback.test": "127.0.0.1",
    "localhost": "127.0.0.1",
    "private-lan.test": "10.0.0.42",
    "private-b.test": "172.16.5.5",
    "private-c.test": "192.168.1.1",
    "link-local.test": "169.254.169.254",
    "multicast.test": "239.0.0.1",
    "broken-dns.test": "__not-an-ip__",
}


class TestHappyPath:
    def test_accepts_public_https_url(self) -> None:
        assert ssrf.is_safe_url("https://example.com/") is True

    def test_accepts_public_http_url(self) -> None:
        assert ssrf.is_safe_url("http://example.com/page?x=1") is True


class TestSchemeRejection:
    @pytest.mark.parametrize(
        "url",
        [
            "ftp://example.com/",
            "file:///etc/passwd",
            "javascript:alert(1)",
            "data:text/html,<h1>x</h1>",
        ],
    )
    def test_rejects_non_http_schemes(self, url: str) -> None:
        assert ssrf.is_safe_url(url) is False


class TestPrivateAddressRejection:
    @pytest.mark.parametrize(
        "host",
        ["loopback.test", "localhost", "private-lan.test", "private-b.test", "private-c.test"],
    )
    def test_rejects_loopback_and_private(self, host: str) -> None:
        assert ssrf.is_safe_url(f"https://{host}/") is False

    def test_rejects_link_local_aws_metadata(self) -> None:
        assert ssrf.is_safe_url("http://link-local.test/latest/meta-data/") is False

    def test_rejects_multicast(self) -> None:
        assert ssrf.is_safe_url("https://multicast.test/") is False


class TestMalformedInput:
    @pytest.mark.parametrize(
        "url",
        ["", "not a url at all", "https://", "http:///no-host"],
    )
    def test_rejects_malformed(self, url: str) -> None:
        assert ssrf.is_safe_url(url) is False

    def test_rejects_when_dns_unresolvable(self) -> None:
        assert ssrf.is_safe_url("https://broken-dns.test/") is False

    def test_rejects_non_string_input(self) -> None:
        assert ssrf.is_safe_url(None) is False  # type: ignore[arg-type]
