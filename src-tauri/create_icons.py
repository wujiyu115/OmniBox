#!/usr/bin/env python3
from PIL import Image

# Create simple blue icons
blue = (59, 130, 246)

# 32x32
img = Image.new('RGBA', (32, 32), blue)
img.save('icons/32x32.png')

# 128x128
img = Image.new('RGBA', (128, 128), blue)
img.save('icons/128x128.png')

# 256x256 (128@2x)
img = Image.new('RGBA', (256, 256), blue)
img.save('icons/128x128@2x.png')

# icon.png
img = Image.new('RGBA', (128, 128), blue)
img.save('icons/icon.png')

print("Icons created successfully")
