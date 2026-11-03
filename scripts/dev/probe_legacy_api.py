import urllib.request
import urllib.error

LEGACY_ROUTES = [
    "http://127.0.0.1:8000/api/terms/clauses",
    "http://127.0.0.1:8000/api/exchange/partners",
    "http://127.0.0.1:8000/api/customers",
    "http://127.0.0.1:8000/api/numbering/series",
]


def probe_url(url: str) -> None:
    print("URL:", url)
    req = urllib.request.Request(url)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            body = resp.read(1000).decode("utf-8", errors="replace")
            print("Status:", resp.status)
            print("Body:", body)
    except urllib.error.HTTPError as err:
        body = err.read(1000).decode("utf-8", errors="replace")
        print("Status:", err.code)
        print("Body:", body)
    except Exception as err:
        print("ERROR:", type(err).__name__, err)
    print("---")


def main() -> None:
    for url in LEGACY_ROUTES:
        probe_url(url)


if __name__ == "__main__":
    main()
