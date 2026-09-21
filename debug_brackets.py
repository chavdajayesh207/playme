with open("src/components/MavFarmView.tsx", "r") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "Unexpected closing" in line or "1541" in str(i):
        pass
    if 1270 < i < 1290:
        print(f"{i+1}: {line.strip()}")
