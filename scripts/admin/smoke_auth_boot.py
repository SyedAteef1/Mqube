import json
import urllib.request
import urllib.error

BOOTSTRAP_URL = "http://127.0.0.1:8001/api/v1/auth/bootstrap"
PAYLOAD = {
    "username": "admin",
    "password": "Admin@123",
    "email": "admin@tileflow.local",
}


def main() -> None:
    body = json.dumps(PAYLOAD).encode("utf-8")
    request = urllib.request.Request(
        BOOTSTRAP_URL,
        data=body,
        headers={"Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(request, timeout=10) as resp:
            print("STATUS", resp.status)
            print(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as err:
        print("STATUS", err.code)
        print(err.read().decode("utf-8"))
    except Exception as err:
        print("ERROR", repr(err))


if __name__ == "__main__":
    main()
