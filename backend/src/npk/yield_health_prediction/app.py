from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict
import google.generativeai as genai
from pydantic import BaseModel


app = FastAPI()

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change this to your frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure Gemini API
GENAI_API_KEY = "AIzaSyDxO5dlN-W99qqnRaB5nxMoIFy_YPJTdts"
genai.configure(api_key=GENAI_API_KEY)

# Define request body model

class CropData(BaseModel):
    selectedCrop: Optional[str] = None
    selectedSoil: Optional[str] = None
    selectedIrrig: Optional[str] = None
    fertilizer: Optional[str] = None
    yield2022: Optional[float] = 0.0
    yield2023: Optional[float] = 0.0
    yield2024: Optional[float] = 0.0
    sowingDate: Optional[str] = None
    SoilPH: Optional[float] = 7.0  # Default neutral pH
    SoilMoisture: Optional[float] = 0.0
    PestDisease: Optional[str] = None
    PrevCrop: Optional[str] = None
    indexData: Optional[Dict] = None
    polygonCoordinates: Optional[list] = None

@app.get("/")
async def root():
    return {"message": "FastAPI Backend Running"}

@app.post("/yield")
async def predictYield(data: CropData):
    try:
        print("Received Data:", data.model_dump())  # Debugging logs

        # Extract satellite indices safely
        index_data = data.indexData
        evi = index_data.get("evi", {}).get("median", "N/A")
        evi2 = index_data.get("evi2", {}).get("median", "N/A")
        nri = index_data.get("nri", {}).get("median", "N/A")
        dswi = index_data.get("dswi", {}).get("median", "N/A")
        ndwi = index_data.get("ndwi", {}).get("median", "N/A")
        ndvi = index_data.get("ndvi", {}).get("median", "N/A")

        # Constructing AI Prompt
        prompt = f"""
        You are an expert in precision agriculture and agronomy. Your task is to analyze the following crop-related data and provide:
        1. *Predicted Crop Yield for 2025* (kg/ha).
        2. *200-word reports*:
            - *Report 1*: Factors affecting crop yield and strategies for improvement.

        ### *Input Data*:
        If any of the input data is null or 0 then ignore that field
        - *Crop*: {data.selectedCrop}
        - *Geolocation*: {data.polygonCoordinates}
        - *Sowing Date*: {data.sowingDate}
        - *Previous Crop*: {data.PrevCrop}
        - *Fertilizer Usage*: {data.fertilizer} kh/ha
        - *Soil Type*: {data.selectedSoil}
        - *Soil pH*: {data.SoilPH}
        - *Soil Moisture*: {data.SoilMoisture}%
        - *Irrigation Type*: {data.selectedIrrig}
        - *Pest/Disease Incidence*: {data.PestDisease}
        - *Remote Sensing Indices*:
            - EVI: {evi}
            - EVI2: {evi2}
            - NRI: {nri}
            - DSWI: {dswi}
            - NDWI: {ndwi}
            - NDVI: {ndvi}
        - *Historical Crop Yields*:
            - 2024: {data.yield2024} kg/ha
            - 2023: {data.yield2023} kg/ha
            - 2022: {data.yield2022} kg/ha

        ### *Expected Output Format*:
        
        Predicted Crop Yield (2025): [Value in kg/ha]

        Potential Yield Issues & Recommendations:
        [200-word report analyzing crop yield influencing factors and solutions]

        """

        # Calling Gemini API
        model = genai.GenerativeModel("gemini-pro")
        response = model.generate_content(prompt)

        return {"prediction": response.text}
        
    except Exception as e:
        return {"error": "Internal Server Error", "message": str(e)}

@app.post("/health")
async def predictHealth(data: CropData):
    try:
        print("Received Data for Health:", data.dict())  # Debugging logs

        # Extract satellite indices safely
        index_data = data.indexData
        evi = index_data.get("evi", {}).get("median", "N/A")
        evi2 = index_data.get("evi2", {}).get("median", "N/A")
        nri = index_data.get("nri", {}).get("median", "N/A")
        dswi = index_data.get("dswi", {}).get("median", "N/A")
        ndwi = index_data.get("ndwi", {}).get("median", "N/A")
        ndvi = index_data.get("ndvi", {}).get("median", "N/A")

        # Constructing AI Prompt
        prompt = f"""
        You are an expert in precision agriculture and agronomy. Your task is to analyze the following crop-related data and provide:
        1. *Predicted Crop Health in Percentage*.
        2. *200-word reports*:
            - *Report 1*: Factors affecting crop health and strategies for improvement.

        ### *Input Data*:
        If any of the input data is null or 0 then ignore that field
        - *Crop*: {data.selectedCrop}
        - *Geolocation*: {data.polygonCoordinates}
        - *Sowing Date*: {data.sowingDate}
        - *Previous Crop*: {data.PrevCrop}
        - *Fertilizer Usage*: {data.fertilizer} kh/ha
        - *Soil Type*: {data.selectedSoil}
        - *Soil pH*: {data.SoilPH}
        - *Soil Moisture*: {data.SoilMoisture}%
        - *Irrigation Type*: {data.selectedIrrig}
        - *Pest/Disease Incidence*: {data.PestDisease}
        - *Remote Sensing Indices*:
            - EVI: {evi}
            - EVI2: {evi2}
            - NRI: {nri}
            - DSWI: {dswi}
            - NDWI: {ndwi}
            - NDVI: {ndvi}
        - *Historical Crop Yields*:
            - 2024: {data.yield2024} kg/ha
            - 2023: {data.yield2023} kg/ha
            - 2022: {data.yield2022} kg/ha

        ### *Expected Output Format*:

        Predicted Crop Health: [Value in %]

        Potential Health Issues & Recommendations:
        [200-word report analyzing crop yield influencing factors and solutions]

        """

        # Calling Gemini API
        model = genai.GenerativeModel("gemini-pro")
        response = model.generate_content(prompt)

        return {"prediction": response.text}

    except Exception as e:
        return {"error": "Internal Server Error", "message": str(e)}

