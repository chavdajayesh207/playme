with open("src/components/MavFarmView.tsx", "r") as f:
    lines = f.readlines()

for i in range(1530, 1580):
    print(f"{i+1}: {lines[i].rstrip()}")
