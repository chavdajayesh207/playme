with open("src/components/MavFarmView.tsx", "r") as f:
    lines = f.readlines()

# Block 1: Cover Art (1048-1062)
# Let's print them to verify
print("Block 1:", "".join(lines[1047:1062]).strip()[:100])

# Block 2: Old Title (1278-1291)
print("Block 2:", "".join(lines[1277:1291]).strip()[:100])

# Block 3: Old Controls (1331-1478)
print("Block 3:", "".join(lines[1330:1478]).strip()[:100])

# Block 4: Carousel + Second Fold (1482-1663)
print("Block 4:", "".join(lines[1481:1663]).strip()[:100])
