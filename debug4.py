with open("src/components/MavFarmView.tsx", "r") as f:
    content = f.read()
idx = content.find("DIM (12%)")
print(content[idx:idx+1500])
