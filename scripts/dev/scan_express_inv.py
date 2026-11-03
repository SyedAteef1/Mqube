import os
import glob
import re


def collect_express_routes() -> list:
    routes = []
    for path in glob.glob("src/routes/*.ts"):
        with open(path, encoding="utf-8") as fh:
            text = fh.read()
        for match in re.finditer(
            r'router\.(get|post|put|delete|patch)\("(/api/[^"]*)"', text
        ):
            routes.append(
                (match.group(1).upper(), match.group(2), os.path.basename(path))
            )
    return routes


def collect_frontend_legacy_references() -> set:
    refs = set()
    for dirpath, _, files in os.walk("src"):
        for filename in files:
            if filename.endswith((".ts", ".tsx")):
                filepath = os.path.join(dirpath, filename)
                with open(filepath, encoding="utf-8") as fh:
                    text = fh.read()
                for match in re.finditer(
                    r'"(/api/(?!v1)[^"\']*)"|\' (/api/(?!v1)[^"\']*)\' ', text
                ):
                    refs.add(match.group(1) or match.group(2))
    return refs


def main() -> None:
    express_routes = collect_express_routes()
    frontend_legacy = collect_frontend_legacy_references()

    print("EXPRESS ROUTES")
    for method, path, source in sorted(express_routes):
        print(f"{method} {path} ({source})")

    print()
    print("FRONTEND LEGACY REFERENCES")
    for url in sorted(frontend_legacy):
        print(url)


if __name__ == "__main__":
    main()
