"""SDF pipeline proof sweep: every atlas glyph x sizes x zoom-outs.
Replicates gola-sdf.js exactly: 1:1 crop -> SS upscale (bilinear) -> threshold
(0.46, SOFT 0.09, gamma 0.7) -> downscale to display -> zoom-out resample.
PASS = surviving alpha mass ratio >= 0.30 (nothing vanishes)."""
from PIL import Image
import json
import io

SOFT = 0.09
GAMMA = 0.7
TH = 0.46
SIZES = [16, 24, 36, 72]
ZOOMS = [1.0, 0.5, 0.33]
RATIO_MIN = 0.30


def threshold(img, tint=(255, 255, 255)):
    px = img.load()
    w, h = img.size
    out = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    op = out.load()
    for y in range(h):
        for x in range(w):
            d = px[x, y][0] / 255.0
            a = (d - TH) / (2 * SOFT) + 0.5
            a = min(1.0, max(0.0, a))
            a = a ** GAMMA
            op[x, y] = (tint[0], tint[1], tint[2], round(a * 255))
    return out


def alpha_mass(img):
    return sum(a for _, _, _, a in img.getdata()) / 255.0


def run(atlas_path, metrics_path):
    atlas = Image.open(atlas_path).convert('RGB')
    m = json.load(open(metrics_path, encoding='utf-8'))
    fails = []
    total = 0
    for ch, g in m['glyphs'].items():
        cell = atlas.crop((g['x'], g['y'], g['x'] + g['w'], g['y'] + g['h']))
        ref = threshold(cell)
        ref_mass = alpha_mass(ref)
        if ref_mass < 1.0:
            continue
        for size in SIZES:
            k = size / m['px']
            dpr = 3
            ss = max(2, -(-int(k * dpr) // 1))
            import math
            ss = max(2, math.ceil(k * dpr))
            big = cell.resize((max(1, cell.width * ss), max(1, cell.height * ss)), Image.BILINEAR)
            th = threshold(big)
            disp_w = max(1, round(g['w'] * k * dpr))
            disp_h = max(1, round(g['h'] * k * dpr))
            disp = th.resize((disp_w, disp_h), Image.BILINEAR)
            for z in ZOOMS:
                zw = max(1, round(disp_w * z))
                zh = max(1, round(disp_h * z))
                out = disp.resize((zw, zh), Image.BILINEAR)
                got = alpha_mass(out)
                exp = ref_mass * (k * dpr * z) ** 2
                ratio = got / exp if exp > 0 else 1.0
                total += 1
                if ratio < RATIO_MIN:
                    fails.append((ch, size, z, round(ratio, 3)))
    return total, fails


if __name__ == '__main__':
    import sys
    grand_fails = []
    grand_total = 0
    pairs = [('sdf-atlas.png', 'sdf-metrics.json'),
             ('sdf-atlas-italic.png', 'sdf-metrics-italic.json')]
    for png, jsn in pairs:
        t, f = run(f'O:/Projects/GolaCSS/assets/sdf/{png}',
                   f'O:/Projects/GolaCSS/assets/sdf/{jsn}')
        grand_total += t
        grand_fails += [(base,) + x for x in f]
    with io.open('O:/Projects/GolaCSS/tools/sweep.txt', 'w', encoding='utf-8') as fo:
        fo.write(f'total checks: {grand_total}\nfails: {len(grand_fails)}\n')
        for row in grand_fails[:100]:
            fo.write('FAIL ' + ' '.join(map(str, row)) + '\n')
    print('total', grand_total, 'fails', len(grand_fails))
