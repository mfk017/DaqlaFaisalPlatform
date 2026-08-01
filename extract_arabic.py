import os
import re

def extract_arabic_strings(directory):
    arabic_pattern = re.compile(r'[\u0600-\u06FF\s(A-Za-z)]*[\u0600-\u06FF]+[\u0600-\u06FF\s(A-Za-z)]*')
    unique_strings = set()
    
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith('.tsx') or file.endswith('.ts'):
                path = os.path.join(root, file)
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    
                    # Split by common string delimiters in JSX to avoid giant blocks
                    # But simpler: just find anything that has arabic characters and surrounding text
                    # Actually, let's extract strings inside "", '', ``, or JSX text >text<
                    
                    # JSX text
                    jsx_text = re.findall(r'>([^<]+)<', content)
                    for text in jsx_text:
                        text = text.strip()
                        if re.search(r'[\u0600-\u06FF]', text):
                            unique_strings.add(text)
                            
                    # Quoted strings
                    quoted_text = re.findall(r'["\']([^"\']+)["\']', content)
                    for text in quoted_text:
                        text = text.strip()
                        if re.search(r'[\u0600-\u06FF]', text):
                            unique_strings.add(text)

    for s in sorted(list(unique_strings)):
        print(s)

extract_arabic_strings('src')
