# pretty_print.py

import json

with open("all_rankings.json", "r") as f:
    data = json.load(f)

with open("all_rankings_pretty.json", "w") as f:
    json.dump(data, f, indent=2)

print("✅ Pretty version saved to all_rankings_pretty.json")
