import sys, os, glob, re

sys.stdout.reconfigure(encoding='utf-8')

def inspect_backend():
    model_files = glob.glob(r"F:\SMRITRretailNX\backend\app\models\*.py")
    schema_files = glob.glob(r"F:\SMRITRretailNX\backend\app\schemas\*.py")
    api_files = glob.glob(r"F:\SMRITRretailNX\backend\app\api\v1\*.py")

    print("=== BACKEND MODELS & SCHEMAS INSPECTION ===")
    for mf in model_files:
        content = open(mf, "r", encoding="utf-8", errors="ignore").read()
        classes = re.findall(r"class\s+([A-Za-z0-9_]+)\b", content)
        tables = re.findall(r'__tablename__\s*=\s*"([^"]+)"', content)
        print(f"Model File: {os.path.basename(mf):<25} | Classes: {classes} | Table: {tables}")

    print("\n=== BACKEND API ROUTES INSPECTION ===")
    for af in api_files:
        content = open(af, "r", encoding="utf-8", errors="ignore").read()
        routes = re.findall(r'@router\.(?:get|post|put|delete|patch)\(\s*"([^"]+)"', content)
        if routes:
            print(f"API Router: {os.path.basename(af):<25} | Routes: {routes[:5]}")

if __name__ == "__main__":
    inspect_backend()
