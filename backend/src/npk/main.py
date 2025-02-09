from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from npk.Data import Cdata
import numpy as np
import pickle
import pandas as pd
from npk.ndvi_prediction import app as ndvi_app
from npk.chatbot.utils import app as chatbot_app
from npk.price_prediction.app import app as price_app
from npk.Report.app import app as report_app
from npk.crop_rotation.app import app as rotation_app
from npk.image_ndvi.app import app as imageNdvi_app

# Initialize FastAPI app
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount the NDVI prediction app
app.mount("/ndvi", ndvi_app)

# mount price prediction app
app.mount("/market", price_app)

# chatbot app
app.mount("/chatbot", chatbot_app)

# Report app
app.mount("/report", report_app)

# crop rotation app
app.mount("/crop-rotation", rotation_app)

# image ndvi app
app.mount("/image-ndvi", imageNdvi_app)

# Load pre-trained model for crop prediction
pickle_in = open("src/npk/model.pkl", "rb")
classifier = pickle.load(pickle_in)

# Crop names (map from class index to crop name)
crops = [
    'rice', 'maize', 'chickpea', 'kidneybeans', 'pigeonpeas', 'mothbeans', 
    'mungbean', 'blackgram', 'lentil', 'pomegranate', 'banana', 'mango', 
    'grapes', 'watermelon', 'muskmelon', 'apple', 'orange', 'papaya', 
    'coconut', 'cotton', 'jute', 'coffee'
]

@app.get('/')
def index():
    return {'message': 'FastAPI server'}

@app.post('/predict')
def predict_crop(data: Cdata):
    try:
        features = [[
            data.N,
            data.P,
            data.K,
            data.PH,
            data.Temp,
            data.Humidity,
            data.Rain
        ]]
        
        prediction = classifier.predict(features)
        return {'Predicted Crop': prediction[0]}
    except Exception as e:
        return {'error': str(e)}

if __name__ == '__main__':
    uvicorn.run(app, host='127.0.0.1', port=8000)