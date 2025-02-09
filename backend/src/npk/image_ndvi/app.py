import os
import io
import base64
from typing import List, Optional
from pydantic import BaseModel
import torch
import torch.nn as nn
import numpy as np
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from torchvision import transforms

# Create FastAPI app
app = FastAPI(title="SAR to Optical Image Converter")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your React app's domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure folders
UPLOAD_FOLDER = 'uploads'
OUTPUT_FOLDER = 'generated'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

# Device configuration
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Image Preprocessing
transform = transforms.Compose([
    transforms.Resize((256, 256)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.5], std=[0.5])
])

class UNetGenerator(nn.Module):
    def __init__(self):
        super(UNetGenerator, self).__init__()
        self.encoder = nn.Sequential(
            self._block(1, 64, 4, 2, 1),
            self._block(64, 128, 4, 2, 1),
            self._block(128, 256, 4, 2, 1),
            self._block(256, 512, 4, 2, 1),
            self._block(512, 512, 4, 2, 1),
        )
        self.decoder = nn.Sequential(
            self._upblock(512, 512, 4, 2, 1),
            self._upblock(512, 256, 4, 2, 1),
            self._upblock(256, 128, 4, 2, 1),
            self._upblock(128, 64, 4, 2, 1),
            nn.ConvTranspose2d(64, 3, 4, 2, 1),
            nn.Tanh()
        )

    def _block(self, in_channels, out_channels, kernel_size, stride, padding):
        return nn.Sequential(
            nn.Conv2d(in_channels, out_channels, kernel_size, stride, padding),
            nn.BatchNorm2d(out_channels),
            nn.LeakyReLU(0.2)
        )

    def _upblock(self, in_channels, out_channels, kernel_size, stride, padding):
        return nn.Sequential(
            nn.ConvTranspose2d(in_channels, out_channels, kernel_size, stride, padding),
            nn.BatchNorm2d(out_channels),
            nn.ReLU()
        )

    def forward(self, x):
        x = self.encoder(x)
        x = self.decoder(x)
        return x

# Load the trained Generator model
generator = UNetGenerator().to(device)
generator.load_state_dict(torch.load("generator.pth", map_location=device))
generator.eval()

# Pydantic models for response
class PixelStats(BaseModel):
    min: float
    max: float
    mean: float

class ProcessedImageResponse(BaseModel):
    generated_image: str
    min_ndvi: float
    max_ndvi: float
    mean_ndvi: float
    pixel_stats: List[PixelStats]

async def process_image(image: Image.Image) -> tuple[str, float, float, float, List[dict]]:
    try:
        sar_image = image.convert("L")
        sar_image = transform(sar_image).unsqueeze(0).to(device)

        with torch.no_grad():
            generated_optical = generator(sar_image)

        generated_optical = generated_optical.squeeze(0).cpu()
        generated_optical = generated_optical * 0.5 + 0.5
        generated_optical = transforms.ToPILImage()(generated_optical)

        output_path = os.path.join(OUTPUT_FOLDER, "generated_ndvi.png")
        generated_optical.save(output_path)

        min_ndvi, max_ndvi, mean_ndvi, pixel_stats = compute_ndvi(output_path)

        buffered = io.BytesIO()
        generated_optical.save(buffered, format="PNG")
        img_str = base64.b64encode(buffered.getvalue()).decode('ascii')

        return img_str, min_ndvi, max_ndvi, mean_ndvi, pixel_stats

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")

def compute_ndvi(image_path: str) -> tuple[float, float, float, List[dict]]:
    try:
        image = Image.open(image_path).convert("L")
        ndvi_array = np.array(image)
        
        ndvi_array = ndvi_array / 127.5 - 1

        min_ndvi = float(np.nanmin(ndvi_array))
        max_ndvi = float(np.nanmax(ndvi_array))
        mean_ndvi = float(np.nanmean(ndvi_array))
        
        height, width = ndvi_array.shape
        pixel_stats = []
        
        for i in range(10):
            y = (i * height) // 10
            ndvi_pixel = ndvi_array[y:y+1, :].flatten()
            pixel_stats.append({
                'min': float(np.nanmin(ndvi_pixel)),
                'max': float(np.nanmax(ndvi_pixel)),
                'mean': float(np.nanmean(ndvi_pixel))
            })
        
        return min_ndvi, max_ndvi, mean_ndvi, pixel_stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error computing NDVI: {str(e)}")

@app.post("/process-image/", response_model=ProcessedImageResponse)
async def process_uploaded_image(file: UploadFile = File(...)):
    if not file:
        raise HTTPException(status_code=400, detail="No file uploaded")
    
    try:
        # Read the uploaded image
        image_data = await file.read()
        image = Image.open(io.BytesIO(image_data))
        
        # Process the image
        generated_image_base64, min_ndvi, max_ndvi, mean_ndvi, pixel_stats = await process_image(image)
        
        return ProcessedImageResponse(
            generated_image=generated_image_base64,
            min_ndvi=min_ndvi,
            max_ndvi=max_ndvi,
            mean_ndvi=mean_ndvi,
            pixel_stats=[PixelStats(**stats) for stats in pixel_stats]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0000", port=8000)