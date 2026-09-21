with open("src/components/MavFarmView.tsx", "r") as f:
    content = f.read()
idx = content.find("Two-Column Grid")
print(content[idx:idx+2500])
