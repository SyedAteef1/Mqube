import os

for path in [r"F:\TileFlow-Clients Data\Tattly Threads\Invoice", r"F:\SMRITRretailNX\TT"]:
    if os.path.exists(path):
        print(f"=== Files in {path} ===")
        for f in os.listdir(path):
            print(" ", f)
