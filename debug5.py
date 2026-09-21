with open("src/components/MavFarmView.tsx", "r") as f:
    lines = f.readlines()
for i, line in enumerate(lines):
    if "Unexpected closing" in line or "1535:" in line or 1530 < i < 1550:
        print(f"{i+1}: {line.rstrip()}")
