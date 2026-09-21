with open("src/components/MavFarmView.tsx", "r") as f:
    content = f.read()
idx = content.find("Background Video Mode Selector")
print(content[idx:idx+1500])
