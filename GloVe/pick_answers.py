import random
import nltk
from wordfreq import zipf_frequency

nltk.download("words")
from nltk.corpus import words as nltk_words

# Set of known English words (from NLTK)
english_words = set(w.lower() for w in nltk_words.words())

def load_wordlist(path="clean_wordlist.txt"):
    with open(path, "r") as f:
        return [w.strip().lower() for w in f if w.strip().isalpha() and 4 <= len(w.strip()) <= 9]

def is_good_word(word):
    # Must be in NLTK dictionary, have good frequency, not start with uppercase
    return (
        word in english_words and
        zipf_frequency(word, "en") >= 3.5  # approx. "moderately common"
    )

def pick_answers(wordlist, n=30, seed=42):
    random.seed(seed)
    filtered = [w for w in wordlist if is_good_word(w)]
    return random.sample(filtered, n)

# MAIN
wordlist = load_wordlist()
answers = pick_answers(wordlist)

print("🎯 Clean Selected Answers:")
for i, word in enumerate(answers, start=1):
    print(f"{i:02d}. {word}")
    with open("selected_answers.txt", "w") as f:
      for word in answers:
        f.write(word + "\n")
