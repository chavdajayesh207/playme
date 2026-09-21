with open("src/components/MavFarmView.tsx", "r") as f:
    content = f.read()
idx = content.find("Column 1: About the Artist")
print(content[idx:idx+1500])
