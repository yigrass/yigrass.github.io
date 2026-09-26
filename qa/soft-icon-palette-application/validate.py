"""Decode every staged icon and verify the approved color transform before copying."""
from pathlib import Path
import json
import hashlib
import numpy as np
from PIL import Image

qa = Path(__file__).resolve().parent
root = qa.parent.parent
config = json.loads((qa / 'filter.json').read_text(encoding='utf-8-sig'))
inputs = json.loads((qa / 'inputs.json').read_text(encoding='utf-8-sig'))
outputs = []
for entry in inputs:
    original = root / 'art/pixel-ui/downloads/calming_icons_512x512' / entry['name']
    source = root / 'art/pixel-ui/downloads/calming_icons_512x512_alter' / entry['name']
    output = qa / 'png' / entry['name']
    assert hashlib.sha256(original.read_bytes()).hexdigest().upper() == entry['originalSha256']
    assert hashlib.sha256(source.read_bytes()).hexdigest().upper() == entry['inputSha256']
    with Image.open(source) as image:
        assert image.size == (512, 512) and image.n_frames == 1
        before = np.array(image.convert('RGBA'))
    with Image.open(output) as image:
        assert image.size == (512, 512) and image.n_frames == 1
        after = np.array(image.convert('RGBA'))
    assert np.array_equal(before[:, :, 3], after[:, :, 3]), f"Alpha changed: {entry['name']}"
    visible = before[:, :, 3] > 0
    rgb = before[:, :, :3].astype(np.float64)
    luma = (rgb * np.array(config['lumaWeights'])).sum(axis=2, keepdims=True)
    expected = luma + config['saturation'] * (rgb - luma)
    expected = (expected * config['contrast'] + 255 * (1-config['contrast']) / 2) * config['brightness']
    expected = np.floor(np.clip(expected, 0, 255) + .5).astype(np.uint8)
    assert np.array_equal(after[:, :, :3][visible], expected[visible]), f"Wrong color: {entry['name']}"
    assert not np.array_equal(before[:, :, :3][visible], after[:, :, :3][visible])
    outputs.append({'name': entry['name'], 'width': 512, 'height': 512, 'frames': 1, 'alphaUnchanged': True, 'colorsVerified': True, 'sha256': hashlib.sha256(output.read_bytes()).hexdigest()})

assert len(outputs) == 64
(qa / 'validated-outputs.json').write_text(json.dumps(outputs, indent=2) + '\n', encoding='utf-8')
print('Verified 64 icons: exact B colors, original dimensions, unchanged per-pixel alpha, untouched inputs.')
