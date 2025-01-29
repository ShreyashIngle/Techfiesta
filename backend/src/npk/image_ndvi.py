from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
import pandas as pd
import rasterio
import pickle
import logging
import numpy as np

app = FastAPI(title="Image NDVI Prediction API")

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# Load the model
try:
    with open("src/npk/corr_model.pkl", "rb") as model_file:
        classifier = pickle.load(model_file)
except FileNotFoundError as e:
    logger.error(f"Required file not found: {e}")
    raise Exception(f"Required file not found: {e}")

# Define input ranges and target scaling ranges
INPUT_RANGE = (0, 1000)  # New input range (e.g., pixel intensity values)
TARGET_RANGE = (0, 1)   # Scaled range for model inputs and outputs

@app.get("/")
async def index():
    return {"message": "Welcome to the NDVI Prediction API"}

@app.post("/image-ndvi-predict")
async def predict(
    vh_file: UploadFile = File(...),
    vv_file: UploadFile = File(...),
):
    """
    Predict NDVI based on VH and VV image inputs.
    """
    try:

        # Calculate mean values for VH and VV bands
        vh_mean = calculate_band_mean(vh_file, "VH")
        vv_mean = calculate_band_mean(vv_file, "VV")

        # Scale inputs to [0, 1] using the new range
        vh_scaled = scale_value(vh_mean, INPUT_RANGE, TARGET_RANGE)
        vv_scaled = scale_value(vv_mean, INPUT_RANGE, TARGET_RANGE)

        # Prepare data for prediction
        processed_data = pd.DataFrame({"VH": [vh_scaled], "VV": [vv_scaled]})
        logger.info(f"mean  vh: {vh_mean},  vv: {vv_mean}")

        # Make predictions
        predictions = predict_ndvi(processed_data)

        # Return prediction with NDVI only
        return JSONResponse(
            content={
                "message": "Prediction successful",
                "input_values": {"VH_mean": vh_mean, "VV_mean": vv_mean},
                "predictions": predictions.to_dict(orient="records"), 
            }
        )

    except Exception as e:
        logger.error(f"Error during prediction: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

def calculate_band_mean(file: UploadFile, band_name: str) -> float:
    """
    Calculate the mean value of a raster band's data.
    """
    try:
        with rasterio.open(file.file) as src:
            band_data = src.read(1).astype(float)
            if src.nodata is not None:
                band_data[band_data == src.nodata] = np.nan
            mean_value = float(np.nanmean(band_data))
            return mean_value
    except Exception as e:
        logger.error(f"Error processing {band_name}: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Error processing {band_name}: {str(e)}")

def scale_value(value: float, original_range: tuple, target_range: tuple) -> float:
    """
    Scale a value from its original range to a target range.
    """
    try:
        original_min, original_max = original_range
        target_min, target_max = target_range
        scaled_value = (value - original_min) / (original_max - original_min) * (target_max - target_min) + target_min
        return scaled_value
    except Exception as e:
        logger.error(f"Error scaling value: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Error scaling value: {str(e)}")

def predict_ndvi(data: pd.DataFrame) -> pd.DataFrame:
    """
    Predict NDVI values using the loaded model.
    """
    try:
        data["predicted_ndvi"] = data.apply(
            lambda row: classifier.predict([[row["VH"], row["VV"]]])[0], axis=1
        )

        return data[["VH", "VV", "predicted_ndvi"]]
    except Exception as e:
        logger.error(f"Error in predict_ndvi: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Error in predict_ndvi: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    logger.info("Starting the FastAPI server...")
    uvicorn.run(app, host="127.0.0.1", port=8000)
