import ipaddress
from urllib.parse import urlparse

SUSPICIOUS_WORDS = ("login", "verify", "account", "secure", "update", "password", "signin", "wallet", "confirm", "suspended")
FEATURE_NAMES = [
    "url_length", "hostname_length", "path_length", "query_length",
    "dot_count", "hyphen_count", "at_count", "digit_count", "slash_count",
    "subdomain_count", "uses_https", "has_ip_address", "has_unusual_port",
    "has_suspicious_word", "has_percent_encoding", "has_double_slash_path"
]

def extract_url_features(url: str) -> dict:
    value = str(url).strip()
    parsed = urlparse(value if "://" in value else "//" + value)
    hostname, path = parsed.hostname or "", parsed.path or ""
    try:
        ipaddress.ip_address(hostname)
        has_ip = 1
    except ValueError:
        has_ip = 0
    try:
        port = parsed.port
        unusual_port = int(port is not None and port not in (80, 443))
    except ValueError:
        unusual_port = 1
    parts = hostname.split(".") if hostname else []
    lower = value.lower()
    return {
        "url_length": len(value), "hostname_length": len(hostname),
        "path_length": len(path), "query_length": len(parsed.query),
        "dot_count": value.count("."), "hyphen_count": value.count("-"),
        "at_count": value.count("@"), "digit_count": sum(c.isdigit() for c in value),
        "slash_count": value.count("/"), "subdomain_count": max(0, len(parts)-2),
        "uses_https": int(parsed.scheme.lower() == "https"), "has_ip_address": has_ip,
        "has_unusual_port": unusual_port,
        "has_suspicious_word": int(any(w in lower for w in SUSPICIOUS_WORDS)),
        "has_percent_encoding": int("%" in value),
        "has_double_slash_path": int("//" in path),
    }
