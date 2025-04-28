# lib.py

from PIL import Image
import imageio
import requests
from io import BytesIO

def extract_evenly_spaced_gif_frames_from_url(gif_url, n_frames=5):
    """Download a GIF from a URL, extract n evenly spaced frames, and save them as PNG."""
    response = requests.get(gif_url)
    gif = Image.open(BytesIO(response.content))

    total_frames = getattr(gif, "n_frames", 1)
    step = max(total_frames // n_frames, 1)
    frames = []

    for i, frame_idx in enumerate(range(0, total_frames, step)):
        if i >= n_frames:
            break
        gif.seek(frame_idx)
        frame = gif.copy().convert("RGB")
        frames.append(frame)

    return frames