import json
import os

# Load the large all_rankings.json file
with open("GloVe/all_rankings.json", "r") as f:
    all_rankings = json.load(f)

# Create a directory to hold the smaller files
os.makedirs("rankings_split", exist_ok=True)

# Split into smaller per-answer files
for answer, rankings in all_rankings.items():
    with open(f"rankings_split/{answer}.json", "w") as out_file:
        json.dump(rankings, out_file)

print("✅ All rankings split and saved to rankings_split/")
