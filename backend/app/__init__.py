import os
from pathlib import Path
from dotenv import load_dotenv

# Load env variables from root or local .env
load_dotenv()

repo_root = Path(__file__).resolve().parent.parent.parent
env_mode = os.getenv("ENVIRONMENT", "").strip().lower()

# Only fall back to .env.example for explicit local/test modes.
# This prevents production from silently using example values.
is_test_run = "PYTEST_CURRENT_TEST" in os.environ
is_local_dev = env_mode in {"development", "local", "test"} or (
    env_mode == "" and (repo_root / ".git").exists()
)

if not (repo_root / ".env").exists():
    example_env = repo_root / ".env.example"
    if example_env.exists() and (is_test_run or is_local_dev):
        load_dotenv(dotenv_path=example_env, override=False)
