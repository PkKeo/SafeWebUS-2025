from fastapi import FastAPI
from pydantic import BaseModel
from PIL import Image
import requests
import torch
import open_clip
from torchvision import transforms
from sklearn.metrics.pairwise import cosine_similarity
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from io import BytesIO
import base64

import mimetypes

#local file
from mylib import gif, clip, database

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Set device
device = "cuda" if torch.cuda.is_available() else "cpu"

# Load CLIP model once
model, _, preprocess = open_clip.create_model_and_transforms('ViT-B-32', pretrained='laion2b_s34b_b79k')
model = model.to(device)
tokenizer = open_clip.get_tokenizer('ViT-B-32')

class UserData(BaseModel):
    gmail: str
    id: str


class ImageRequest(BaseModel):
    image_url: str
    tags: List[str]
    web_url: str
    id: str

class UserIdRequest(BaseModel):
    id: str

@app.get("/")
def root():
    return {"message": "Welcome to the SafeWebUS API. Use POST /check_image for example :)"}

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/add_user")
def register(user_data: UserData):
    return database.registerToDB(user_data)
    

@app.post("/check_image")
async def check_image(data: ImageRequest):
    try:
        imageList = []
        # Validate tag input
        if not data.tags:
            return {"error": "Tag list is empty. Provide at least one tag."}

        # Load image from base64 or URL
        if data.image_url.startswith("data:image"):
            # Handle base64 image
            try:
                header, encoded = data.image_url.split(",", 1)
                image_data = base64.b64decode(encoded)
                image = Image.open(BytesIO(image_data)).convert("RGB")

                
            except Exception:
                return {"error": "Invalid base64 image data."}
            
        # Check if the image URL is an SVG file
        elif data.image_url.endswith(".svg") or "svg" in mimetypes.guess_type(data.image_url)[0]:
            print(f"SVG Image at {data.image_url}")
            return {"similarity_scores": 0} 
        
        elif data.image_url.endswith(".gif") or "gif" in mimetypes.guess_type(data.image_url)[0]:
            for frame in  gif.extract_evenly_spaced_gif_frames_from_url(data.image_url):
                frame_input = preprocess(frame).unsqueeze(0).to(device)
                imageList.append(frame_input)
        else:
            # Handle HTTP(S) image
            headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
            response = requests.get(data.image_url, headers=headers, stream=True, timeout=5)
            if response.status_code != 200:
                return {"error": f"Failed to fetch image: HTTP {response.status_code}"}

            if 'image' not in response.headers.get('Content-Type', ''):
                return {"error": "URL did not return an image"}

            image = Image.open(BytesIO(response.content)).convert("RGB")

        # Preprocess image
        if len(imageList) == 0:
            image_input = preprocess(image).unsqueeze(0).to(device)
            imageList.append(image_input)

        return clip.get_best_tag_per_image(model, tokenizer, imageList, data.tags, device, data.web_url, data.id, data.image_url)

    except Exception as e:
        return {"error": str(e)}
    

@app.post("/abort_count_by_web")
async def abort_count_by_web(request: UserIdRequest):
    return database.getCountByWeb(request)

@app.post("/abort_count_by_hour")
def abort_count_by_hour(request: UserIdRequest):
    return database.getCountByHour(request)



@app.post("/abort_count_by_tag")
async def abort_count_by_tag(request: UserIdRequest):
    return database.getCountByTag(request)
