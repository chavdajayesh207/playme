import re

with open("src/components/MavFarmView.tsx", "r") as f:
    content = f.read()

start_marker = "{/* Normal Dashboard Song Title + Artist (Only shown when lyrics are off) */}"
# The end of this block is before the "Circular Tracks Carousel Slider"
end_marker = "{/* Circular Tracks Carousel Slider */}"

if start_marker in content and end_marker in content:
    start_idx = content.find(start_marker)
    end_idx = content.find(end_marker)
    
    if start_idx != -1 and end_idx != -1:
        new_content = content[:start_idx] + content[end_idx:]
        with open("src/components/MavFarmView.tsx", "w") as f:
            f.write(new_content)
        print("Removed old controls block successfully.")
    else:
        print("Markers found but indexes are wrong.")
else:
    print("Could not find start or end markers.")
