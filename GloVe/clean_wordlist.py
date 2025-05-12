# clean_wordlist.py

import re

# Define common function words to remove (you can expand this list)
common_words = {
    "the", "and", "in", "of", "to", "a", "an", "is", "are", "was", "were",
    "for", "on", "with", "at", "by", "from", "as", "be", "that", "this", "it",
    "or", "but", "if", "so", "we", "they", "he", "she", "you", "i", "can"
}

def is_clean_word(word):
    # Only keep purely alphabetic words (no digits, no symbols)
    return word.isalpha() and word not in common_words

def clean_wordlist(input_file="wordlist.txt", output_file="clean_wordlist.txt"):
    with open(input_file, "r") as infile:
        words = [line.strip().lower() for line in infile]

    clean_words = [word for word in words if is_clean_word(word)]

    with open(output_file, "w") as outfile:
        for word in clean_words:
            outfile.write(word + "\n")

    print(f"Filtered list saved to {output_file} ({len(clean_words)} words kept)")

# Run it
clean_wordlist()
