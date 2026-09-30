import re

# Read the original file
with open('/src/components/RightDrawer.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Read the new shapes content
with open('/tmp/new_shapes.txt', 'r', encoding='utf-8') as f:
    new_shapes = f.read()

# Define the start and end anchors for the shape template list
# The block starts right after 'shape: [' and ends before the closing '],' followed by 'icons: ['
pattern = r'(\s+shape:\s*\[\s*)(.*?)(},\s*\]\s*,\s*icons:\s*\[)'

# Let's perform a regex search to see if we can find it
match = re.search(pattern, content, re.DOTALL)
if match:
    print("Found shape block! Replacing...")
    # Replace the block
    replaced_content = re.sub(pattern, r'\1' + new_shapes + r'\3', content, flags=re.DOTALL)
    
    # Save the modified content back
    with open('/src/components/RightDrawer.tsx', 'w', encoding='utf-8') as f:
        f.write(replaced_content)
    print("Successfully replaced!")
else:
    print("Error: Could not locate shape block in RightDrawer.tsx.")
