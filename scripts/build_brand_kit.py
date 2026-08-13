from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import colorsys

SOURCE = Path('/home/ubuntu/misstice-source/public/brand/misstice-mark.png')
OUT = Path('/home/ubuntu/webdev-static-assets/misstice-brand-kit')
OUT.mkdir(parents=True, exist_ok=True)

EUCALYPTUS = '#2E6953'
CHAMPAGNE = '#D9A566'
ABRICOT = '#C96A45'
CREAM = '#FFF8F2'
INK = '#194638'
WHITE = '#FFFFFF'

# The source export has a grey checkerboard baked into the RGB pixels.
# Keep saturated brand pixels and remove low-saturation background pixels.
src = Image.open(SOURCE).convert('RGB')
pix = src.load()
mask = Image.new('L', src.size, 0)
mp = mask.load()
for y in range(src.height):
    for x in range(src.width):
        r, g, b = pix[x, y]
        h, s, v = colorsys.rgb_to_hsv(r / 255.0, g / 255.0, b / 255.0)
        saturation = s * 255
        # Brand greens/oranges/golds are saturated; the baked checkerboard is neutral.
        if saturation >= 22 and v < 0.99:
            mp[x, y] = min(255, int((saturation - 12) * 14))

# Smooth only the alpha edge slightly to avoid jagged halos.
mask = mask.filter(ImageFilter.GaussianBlur(0.45))
rgba = src.convert('RGBA')
rgba.putalpha(mask)

bbox = mask.getbbox()
if not bbox:
    raise RuntimeError('No colored logo content detected.')
# Add a small transparent margin around the mark.
pad = 36
left = max(0, bbox[0] - pad)
top = max(0, bbox[1] - pad)
right = min(src.width, bbox[2] + pad)
bottom = min(src.height, bbox[3] + pad)
mark = rgba.crop((left, top, right, bottom))
mark.save(OUT / 'misstice-symbol-transparent.png', optimize=True)

# A clean monochrome rendering from the alpha channel.
def solid_mark(color, filename, background=None, size=None):
    base = mark if size is None else mark.resize((size, size), Image.Resampling.LANCZOS)
    alpha = base.getchannel('A')
    canvas = Image.new('RGBA', base.size, background if background else (0, 0, 0, 0))
    fill = Image.new('RGBA', base.size, color)
    fill.putalpha(alpha)
    canvas.alpha_composite(fill)
    canvas.save(OUT / filename, optimize=True)

solid_mark(WHITE, 'misstice-symbol-white.png')
solid_mark(INK, 'misstice-symbol-ink.png')
solid_mark(EUCALYPTUS, 'misstice-symbol-eucalyptus.png')

# Small usage variants.
for size, name in [(1024, 'misstice-avatar-1024.png'), (512, 'misstice-avatar-512.png'), (192, 'misstice-favicon-192.png'), (64, 'misstice-favicon-64.png')]:
    solid_mark(EUCALYPTUS, name, background=CREAM, size=size)

# A social avatar on eucalyptus with a white mark.
for size, name in [(1024, 'misstice-avatar-dark-1024.png'), (512, 'misstice-avatar-dark-512.png')]:
    solid_mark(WHITE, name, background=EUCALYPTUS, size=size)

serif_path = '/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf'
sans_path = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
serif = ImageFont.truetype(serif_path, 112)
sans = ImageFont.truetype(sans_path, 28)

def wordmark(filename, text_color, background, transparent=False):
    width, height = 1800, 420
    canvas = Image.new('RGBA', (width, height), (0, 0, 0, 0) if transparent else background)
    icon = mark.resize((300, 300), Image.Resampling.LANCZOS)
    x, y = 90, (height - icon.height) // 2
    if text_color == WHITE:
        alpha = icon.getchannel('A')
        icon = Image.new('RGBA', icon.size, WHITE)
        icon.putalpha(alpha)
    canvas.alpha_composite(icon, (x, y))
    draw = ImageDraw.Draw(canvas)
    text_x = x + icon.width + 55
    text_y = 135
    draw.text((text_x, text_y), 'Misstice', font=serif, fill=text_color)
    draw.text((text_x + 8, 282), 'Le Carnet de Confiance', font=sans, fill=text_color)
    canvas.save(OUT / filename, optimize=True)

wordmark('misstice-wordmark-light.png', INK, CREAM)
wordmark('misstice-wordmark-dark.png', WHITE, EUCALYPTUS)
wordmark('misstice-wordmark-transparent.png', INK, None, transparent=True)

# Compact email header variant.
email = Image.new('RGBA', (1600, 420), CREAM)
email_icon = mark.resize((260, 260), Image.Resampling.LANCZOS)
email.alpha_composite(email_icon, (92, 80))
draw = ImageDraw.Draw(email)
draw.text((405, 126), 'Misstice', font=serif, fill=INK)
draw.text((414, 270), 'Le Carnet de Confiance', font=sans, fill=EUCALYPTUS)
email.save(OUT / 'misstice-email-header.png', optimize=True)

# A concise usage guide delivered with the files.
(OUT / 'README.md').write_text('''# Kit logo Misstice\n\nLe symbole source a été nettoyé pour retirer le damier gris intégré à l’export initial.\n\n## Fichiers\n\n- `misstice-symbol-transparent.png` : symbole M-papillon en couleurs, fond transparent.\n- `misstice-symbol-white.png` : symbole blanc pour fonds eucalyptus ou photo.\n- `misstice-symbol-ink.png` : symbole encre pour fonds clairs.\n- `misstice-symbol-eucalyptus.png` : symbole monochrome eucalyptus.\n- `misstice-wordmark-light.png` : logo horizontal pour fond clair.\n- `misstice-wordmark-dark.png` : logo horizontal pour fond sombre.\n- `misstice-wordmark-transparent.png` : logo horizontal transparent.\n- `misstice-favicon-192.png` et `misstice-favicon-64.png` : favicon et usages très petits.\n- `misstice-avatar-1024.png` et `misstice-avatar-dark-1024.png` : profils sociaux et photo de profil email.\n- `misstice-email-header.png` : en-tête email.\n\n## Règle d’usage\n\nLe symbole seul sert d’icône, de favicon et de repère dans les micro-interactions. Le wordmark sert à l’en-tête, aux documents et aux emails. L’étoile centrale ne doit pas être séparée du symbole dans les usages institutionnels : elle raconte l’étincelle de départ et la confiance qui relie les deux ailes.\n''', encoding='utf-8')
print(f'Created {len(list(OUT.iterdir()))} files in {OUT}')
