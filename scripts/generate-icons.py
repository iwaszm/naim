from pathlib import Path
from PIL import Image, ImageDraw

root = Path(__file__).resolve().parents[1] / 'public' / 'icons'
root.mkdir(parents=True, exist_ok=True)

for size in (192, 512):
    image = Image.new('RGB', (size, size), '#11140e')
    draw = ImageDraw.Draw(image)
    scale = size / 512
    def box(values):
        return tuple(round(value * scale) for value in values)
    draw.rounded_rectangle(box((56, 56, 456, 456)), radius=round(108 * scale), fill='#f0e400')
    draw.arc(box((130, 152, 382, 362)), 190, 344, fill='#11140e', width=round(27 * scale))
    draw.arc(box((130, 152, 382, 362)), 10, 164, fill='#11140e', width=round(27 * scale))
    draw.ellipse(box((236, 235, 276, 275)), fill='#11140e')
    image.save(root / f'naim-{size}.png')
