import numpy as np
import json

def load_glove_vectors(glove_path):
    print("Loading GloVe vectors...")
    vectors = {}
    with open(glove_path, 'r', encoding='utf8') as f:
        for line in f:
            parts = line.strip().split()
            word = parts[0]
            vector = np.array(parts[1:], dtype='float32')
            vectors[word] = vector
    print(f"Loaded {len(vectors)} vectors.")
    return vectors

def cosine_similarity(a, b):
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

def generate_rankings(wordlist, answer, vectors):
    if answer not in vectors:
        print(f"⚠️  Skipping '{answer}' — not found in GloVe.")
        return None
    answer_vec = vectors[answer]
    scores = []
    for word in wordlist:
        if word == answer or word not in vectors:
            continue
        sim = cosine_similarity(answer_vec, vectors[word])
        scores.append((word, sim))
    scores.sort(key=lambda x: -x[1])
    return {word: rank + 1 for rank, (word, _) in enumerate(scores)}

# Load vectors and wordlist
glove_path = "glove.6B.100d.txt"
wordlist_path = "clean_wordlist.txt"
output_file = "all_rankings.json"

answers = [
    "mirror", "castle", "volcano", "rhythm", "sunset", "debate", "puzzle", "robot", "signal", "criticize",
    "search", "hierarchy", "qualified", "arrival", "control", "grasp", "remix", "smiling", "cheer", "throat",
    "daughter", "echo", "thread", "balance", "gesture", "lens", "orbit", "portal", "filter", "shelter"
]

vectors = load_glove_vectors(glove_path)

with open(wordlist_path, "r") as f:
    wordlist = [line.strip().lower() for line in f]

all_rankings = {}

for answer in answers:
    rankings = generate_rankings(wordlist, answer, vectors)
    if rankings:
        all_rankings[answer] = rankings
        print(f"✅ Added rankings for: {answer}")

# Save output
with open(output_file, "w") as f:
    json.dump(all_rankings, f, indent=2)

print(f"🎉 All rankings saved to {output_file}")
