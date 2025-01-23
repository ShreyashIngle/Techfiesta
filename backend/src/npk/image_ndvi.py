from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
import pandas as pd
import rasterio
import pickle
import logging
import numpy as np

app = FastAPI(title="Image NDVI Prediction API")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load the model
try:
    with open("src/npk/corr_model.pkl", "rb") as model_file:
        classifier = pickle.load(model_file)
except FileNotFoundError as e:
    logger.error(f"Required file not found: {e}")
    raise Exception(f"Required file not found: {e}")

@app.get("/")
async def index():
    return {"message": "Welcome to the Image NDVI Prediction API"}

@app.post("/image-ndvi-predict")
async def predict(
    vh_file: UploadFile = File(...),
    vv_file: UploadFile = File(...),
    ndvi_file: UploadFile = None,
    cloud_cover: float = None,
    tolerance: float = None,
    use_optional_values: bool = False
):
    try:
        vh_mean = calculate_band_mean(vh_file, "VH")
        vv_mean = calculate_band_mean(vv_file, "VV")

        if use_optional_values:
            ndvi_mean = None
            if ndvi_file:
                ndvi_mean = calculate_band_mean(ndvi_file, "NDVI")
            
            if cloud_cover is not None and tolerance is not None:
                # Check cloud cover against tolerance
                if cloud_cover > tolerance:
                    processed_data = pd.DataFrame({"VH": [vh_mean], "VV": [vv_mean], "ndvi": [ndvi_mean]})
                    predictions = predict_ndvi(processed_data)
                    return JSONResponse(
                        content={
                            "message": "Used model for prediction due to high cloud cover",
                            "predictions": predictions.to_dict(orient="records"),
                        }
                    )
                else:
                    return JSONResponse(
                        content={
                            "message": "Using actual NDVI values due to acceptable cloud cover",
                            "actual_values": {
                                "VH": vh_mean,
                                "VV": vv_mean,
                                "ndvi": ndvi_mean,
                            },
                        }
                    )
            else:
                # If cloud_cover or tolerance is missing, still predict
                processed_data = pd.DataFrame({"VH": [vh_mean], "VV": [vv_mean], "ndvi": [ndvi_mean]})
                predictions = predict_ndvi(processed_data)
                return JSONResponse(
                    content={
                        "message": "Predicted NDVI without complete optional parameters",
                        "predictions": predictions.to_dict(orient="records"),
                    }
                )
        else:
            # Prediction without NDVI values
            processed_data = pd.DataFrame({"VH": [vh_mean], "VV": [vv_mean]})
            predictions = predict_ndvi(processed_data)
            return JSONResponse(
                content={
                    "message": "Prediction without NDVI values",
                    "predictions": predictions.to_dict(orient="records"),
                }
            )

    except Exception as e:
        logger.error(f"Error during prediction: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

def calculate_band_mean(file: UploadFile, band_name: str) -> float:
    """Calculate the mean value of a raster band's data."""
    try:
        with rasterio.open(file.file) as src:
            band_data = src.read(1).astype(float)
            if src.nodata is not None:
                band_data[band_data == src.nodata] = np.nan
            return float(np.nanmean(band_data))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing {band_name}: {str(e)}")

def predict_ndvi(data: pd.DataFrame) -> pd.DataFrame:
    """Predict NDVI values using the loaded model."""
    try:
        data["predicted_ndvi"] = data.apply(
            lambda row: classifier.predict([[row["VH"], row["VV"]]])[0], axis=1
        )
        return data
    except Exception as e:
        logger.error(f"Error in predict_ndvi: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Error in predict_ndvi: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)