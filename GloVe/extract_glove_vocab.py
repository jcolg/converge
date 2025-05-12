# extract_glove_vocab.py

def extract_glove_vocab(glove_path, output_path="wordlist.txt"):
    with open(glove_path, 'r', encoding='utf8') as f_in, open(output_path, 'w') as f_out:
        for line in f_in:
            word = line.strip().split()[0]
            f_out.write(word + '\n')

extract_glove_vocab("glove.6B.100d.txt")

