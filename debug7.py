with open("src/components/MavFarmView.tsx", "r") as f:
    content = f.read()
idx = content.find("Column 2: Credits & Upcoming Queue")
print(content[idx:idx+2000])
