from pathlib import Path
import math
import subprocess
import shutil
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path('/home/ubuntu/misstice-source')
MARK_PATH = ROOT / 'public/brand/misstice-mark.png'
OUT = ROOT / 'public/motion'
FRAMES = OUT / 'frames'
OUT.mkdir(parents=True, exist_ok=True)
FRAMES.mkdir(parents=True, exist_ok=True)

W, H = 1600, 900
FPS = 30
CREAM = (255, 248, 242, 255)
EUCALYPTUS = (46, 105, 83, 255)
CHAMPAGNE = (217, 165, 102, 255)
ABRICOT = (201, 106, 69, 255)
mark = Image.open(MARK_PATH).convert('RGBA')

# Keep the full logo visible with a stable 16:9 composition.
def scaled_mark(height):
    ratio = height / mark.height
    return mark.resize((round(mark.width * ratio), round(mark.height * ratio)), Image.Resampling.LANCZOS)

def ease(t):
    t = max(0.0, min(1.0, t))
    return 1 - (1 - t) ** 3

def composite_mark(canvas, height, opacity, y_offset=0.0, rotation=0.0):
    logo = scaled_mark(height)
    if rotation:
        logo = logo.rotate(rotation, resample=Image.Resampling.BICUBIC, expand=True)
    if opacity < 1:
        alpha = logo.getchannel('A').point(lambda value: int(value * max(0.0, min(1.0, opacity))))
        logo.putalpha(alpha)
    x = (W - logo.width) // 2
    y = int((H - logo.height) // 2 + y_offset)
    # A soft glow around the mark during the reveal.
    if opacity > 0.04:
        glow_alpha = logo.getchannel('A').filter(ImageFilter.GaussianBlur(20))
        glow_alpha = glow_alpha.point(lambda value: int(value * 0.22 * opacity))
        glow = Image.new('RGBA', logo.size, CHAMPAGNE)
        glow.putalpha(glow_alpha)
        canvas.alpha_composite(glow, (x, y))
    canvas.alpha_composite(logo, (x, y))

def draw_sparkle(canvas, cx, cy, size, opacity=1.0, color=CHAMPAGNE):
    layer = Image.new('RGBA', canvas.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    alpha = int(255 * max(0.0, min(1.0, opacity)))
    c = (color[0], color[1], color[2], alpha)
    r = size
    draw.polygon([(cx, cy-r*1.8), (cx+r*0.45, cy-r*0.45), (cx+r*1.8, cy), (cx+r*0.45, cy+r*0.45), (cx, cy+r*1.8), (cx-r*0.45, cy+r*0.45), (cx-r*1.8, cy), (cx-r*0.45, cy-r*0.45)], fill=c)
    glow = layer.filter(ImageFilter.GaussianBlur(max(4, int(size * 0.8))))
    canvas.alpha_composite(glow)
    canvas.alpha_composite(layer)

def draw_star_field(canvas, progress):
    # Sparse, deterministic stars trace a gentle arc around the final logo.
    anchors = [(500, 290, -0.7), (1090, 270, -1.0), (420, 610, -0.3), (1190, 590, -0.5), (690, 185, -1.5), (920, 705, -1.2)]
    for i, (x, y, delay) in enumerate(anchors):
        local = max(0.0, min(1.0, (progress + delay * 0.18)))
        pulse = 0.4 + 0.6 * (0.5 + 0.5 * math.sin(progress * math.pi * 2.0 + i))
        if local > 0:
            draw_sparkle(canvas, x, y, 5 + (i % 2) * 3, opacity=local * pulse, color=CHAMPAGNE if i % 2 == 0 else ABRICOT)

def render_sequence(prefix, duration, motion):
    count = int(duration * FPS)
    for idx in range(count):
        t = idx / FPS
        p = t / duration
        frame = Image.new('RGBA', (W, H), CREAM)
        if motion == 'logo':
            reveal = ease((t - 0.55) / 1.55)
            sparkle_in = ease(min(1.0, t / 0.65))
            sparkle_out = 1.0 if t < 2.2 else max(0.0, 1.0 - (t - 2.2) / 0.6)
            draw_sparkle(frame, W // 2, H // 2, 12 + int(16 * sparkle_in), opacity=sparkle_in * sparkle_out)
            bob = math.sin(t * math.pi * 1.5) * 3.0
            composite_mark(frame, int(510 + 22 * reveal), reveal, y_offset=bob, rotation=-2.0 + 2.0 * reveal)
        else:
            sparkle_progress = ease(min(1.0, t / 1.25))
            logo_progress = ease((t - 1.0) / 2.2)
            final_opacity = 0.5 + 0.5 * ease((t - 1.2) / 1.8)
            draw_sparkle(frame, W // 2, H // 2, 10 + int(24 * sparkle_progress), opacity=max(0.0, 1.0 - max(0.0, t - 1.0) / 0.9))
            draw_star_field(frame, ease((t - 1.3) / 3.5))
            bob = math.sin(t * math.pi * 1.1) * 4.0
            composite_mark(frame, int(490 + 26 * logo_progress), final_opacity, y_offset=bob, rotation=-3.0 + 3.0 * logo_progress)
        frame.convert('RGB').save(FRAMES / f'{prefix}_{idx:04d}.jpg', quality=94, optimize=True)


def encode(prefix, output, crf='18'):
    pattern = str(FRAMES / f'{prefix}_%04d.jpg')
    command = ['ffmpeg', '-y', '-framerate', str(FPS), '-i', pattern, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', crf, '-movflags', '+faststart', str(output)]
    subprocess.run(command, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

render_sequence('logo_reveal', 4, 'logo')
encode('logo_reveal', OUT / 'misstice-logo-reveal-local.mp4')
render_sequence('brand_motion', 8, 'brand')
encode('brand_motion', OUT / 'misstice-brand-motion-local.mp4')

# Keep frames out of the delivery folder after encoding to keep the repository light.
shutil.rmtree(FRAMES, ignore_errors=True)
print(OUT / 'misstice-logo-reveal-local.mp4')
print(OUT / 'misstice-brand-motion-local.mp4')
