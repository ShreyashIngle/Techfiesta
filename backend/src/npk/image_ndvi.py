from fastapi import FastAPI, UploadFile, File, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
import pandas as pd
import rasterio
import pickle
import logging
import numpy as np

# Initialize FastAPI app
app = FastAPI(title="NDVI Prediction API")

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load the model
try:
    with open("src/npk/corr_model.pkl", "rb") as model_file:
        classifier = pickle.load(model_file)
except FileNotFoundError as e:
    logger.error(f"Required file not found: {e}")
    raise Exception(f"Required file not found: {e}")

# Custom exception handler for validation errors
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.error(f"Validation error: {exc.errors()} for request body: {exc.body}")
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors(), "body": exc.body}
    )

# Custom exception handler for general exceptions
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={"message": "Internal Server Error"}
    )

@app.get("/")
async def index():
    return {"message": "Welcome to the NDVI Prediction API"}

@app.post("/image-ndvi-predict")
async def predict(
    vh_file: UploadFile = File(...),
    vv_file: UploadFile = File(...),
    scale_method: str = "log"  # New parameter to select scaling method
):
    """
    Predict NDVI based on VH and VV image inputs.
    """
    try:
        # Calculate mean values for VH and VV bands with new scaling method
        vh_mean, vh_scaled = calculate_band_mean(vh_file, "VH", scale_method)
        vv_mean, vv_scaled = calculate_band_mean(vv_file, "VV", scale_method)

        # Log values
        logger.info(f"VH Mean (Raw): {vh_mean}, VH Scaled: {vh_scaled}")
        logger.info(f"VV Mean (Raw): {vv_mean}, VV Scaled: {vv_scaled}")

        # Prepare data for prediction
        processed_data = pd.DataFrame({"VH": [vh_scaled], "VV": [vv_scaled]})
        predictions = predict_ndvi(processed_data)

        # Return prediction with NDVI only
        return JSONResponse(
            content={
                "message": "Prediction successful",
                "input_values": {
                    "VH_mean_raw": vh_mean,
                    "VH_mean_scaled": vh_scaled,
                    "VV_mean_raw": vv_mean,
                    "VV_mean_scaled": vv_scaled
                },
                "predictions": predictions.to_dict(orient="records"),
            }
        )

    except Exception as e:
        logger.error(f"Error during prediction: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

def calculate_band_mean(file: UploadFile, band_name: str, scale_method: str):
    """
    Calculate the mean value of a raster band's data with corrected scaling.
    """
    try:
        with rasterio.open(file.file) as src:
            band_data = src.read(1).astype(float)
            if src.nodata is not None:
                band_data[band_data == src.nodata] = np.nan

            raw_mean = float(np.nanmean(band_data))  # Raw mean value

            # Apply scaling based on the method
            if scale_method == "log":
                # Add small epsilon to avoid log(0)
                epsilon = 1e-10
                band_data = np.where(band_data > 0, 
                                   10 * np.log10(band_data + epsilon), 
                                   -25)  # Set very low values to -25 dB
                # Normalize between -25 dB and 0 dB
                scaled_data = (band_data + 25) / 25
                scaled_mean = float(np.nanmean(scaled_data))
                
            elif scale_method == "normalize":
                # Normalize based on typical SAR backscatter range
                scaled_data = band_data / 10000.0
                scaled_mean = float(np.nanmean(scaled_data))
                
            elif scale_method == "minmax":
                band_min = np.nanpercentile(band_data, 1)  # Use 1st percentile instead of min
                band_max = np.nanpercentile(band_data, 99)  # Use 99th percentile instead of max
                scaled_data = (band_data - band_min) / (band_max - band_min)
                scaled_mean = float(np.nanmean(np.clip(scaled_data, 0, 1)))
                
            elif scale_method == "standardize":
                mean = np.nanmean(band_data)
                std_dev = np.nanstd(band_data)
                if std_dev == 0:
                    raise ValueError(f"{band_name} has zero standard deviation")
                scaled_data = (band_data - mean) / std_dev
                scaled_mean = float(np.nanmean(scaled_data))
            
            else:
                raise ValueError(f"Unknown scaling method: {scale_method}")

            return raw_mean, scaled_mean
            
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing {band_name}: {str(e)}")

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
    logger.info("Starting image NDVI FastAPI server...")
    uvicorn.run(app, host="127.0.0.1", port=8000)