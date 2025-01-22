from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import pickle
import logging
from scipy.interpolate import interp1d
from typing import Dict, List

# Initialize FastAPI app
app = FastAPI(title="NDVI Prediction API")

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load pre-trained model
try:
    with open("src/npk/corr_model.pkl", "rb") as model_file:
        classifier = pickle.load(model_file)
except FileNotFoundError as e:
    logger.error(f"Required file not found: {e}")
    raise Exception(f"Required file not found: {e}")

@app.get("/")
async def index():
    return {"message": "Welcome to the NDVI Prediction API"}

@app.post("/predict")
async def predict(
    vh_file: UploadFile = File(...),
    vv_file: UploadFile = File(...),
    ndvi_file: UploadFile = File(...),
    cloud_threshold: float = Query(20.0, ge=0.0, le=100.0, description="Maximum allowable cloud coverage percentage")
):
    """
    Endpoint to predict NDVI values based on VH and VV data.
    """
    try:
        # Validate file types
        for file in [vh_file, vv_file, ndvi_file]:
            if not file.filename.endswith('.csv'):
                raise HTTPException(
                    status_code=400, 
                    detail=f"{file.filename} must be a CSV file"
                )

        # Read CSV files
        df_vh = pd.read_csv(vh_file.file)
        df_vv = pd.read_csv(vv_file.file)
        df_ndvi = pd.read_csv(ndvi_file.file)

        # Validate required columns
        required_columns = {
            "vh": ["date", "mean"],
            "vv": ["date", "mean"],
            "ndvi": ["date", "mean", "cloudCoveragePercent"]
        }
        
        for name, df, cols in zip(
            ["vh", "vv", "ndvi"],
            [df_vh, df_vv, df_ndvi],
            required_columns.values()
        ):
            missing_cols = set(cols) - set(df.columns)
            if missing_cols:
                raise HTTPException(
                    status_code=400,
                    detail=f"Missing columns in {name} file: {list(missing_cols)}"
                )

        # Process the data
        processed_data = create_data(df_vh, df_vv, df_ndvi, cloud_threshold)
        
        # Make predictions
        predictions = handle_cloud_coverage_and_predict(processed_data, cloud_threshold)

        # Convert 'date' column to string format
        predictions["date"] = predictions["date"].dt.strftime("%Y-%m-%d")

        return JSONResponse(content={
            "message": "Prediction successful",
            "predictions": predictions.to_dict(orient="records")
        })

    except Exception as e:
        logger.error(f"Error during prediction: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

def create_data(
    vh_data: pd.DataFrame,
    vv_data: pd.DataFrame,
    ndvi_data: pd.DataFrame,
    cloud_threshold: float
) -> pd.DataFrame:
    """
    Process and merge VH, VV, and NDVI data using scipy interpolation.
    """
    try:
        # Merge Sentinel-1 data
        sent1_data = pd.merge(vh_data, vv_data, on="date", how="inner", 
                            suffixes=('_vh', '_vv'))
        
        # Convert dates to datetime
        sent1_data["date"] = pd.to_datetime(sent1_data["date"])
        ndvi_data["date"] = pd.to_datetime(ndvi_data["date"])
        
        # Create a copy of original NDVI data with cloud coverage info
        ndvi_with_clouds = ndvi_data.copy()
        
        # Filter NDVI data based on cloud coverage threshold for interpolation
        ndvi_data_filtered = ndvi_data[ndvi_data["cloudCoveragePercent"] <= cloud_threshold]
        
        if len(ndvi_data_filtered) == 0:
            raise ValueError(f"No NDVI data remaining after applying cloud threshold of {cloud_threshold}%")
        
        # Interpolate NDVI data using scipy.interpolate.interp1d
        ndvi_data_filtered = ndvi_data_filtered.sort_values("date")
        interp_func = interp1d(
            ndvi_data_filtered["date"].map(pd.Timestamp.timestamp),
            ndvi_data_filtered["mean"],
            kind="linear",
            fill_value="extrapolate"
        )
        
        # Generate interpolated values
        interpolated_dates = pd.date_range(
            start=ndvi_data_filtered["date"].min(), 
            end=ndvi_data_filtered["date"].max(), 
            freq="D"
        )
        interpolated_ndvi = pd.DataFrame({
            "date": interpolated_dates,
            "mean": interp_func(interpolated_dates.map(pd.Timestamp.timestamp))
        })
        
        # Merge Sentinel-1 data with interpolated NDVI
        merged_data = pd.merge_asof(
            sent1_data.sort_values("date"),
            interpolated_ndvi.sort_values("date"),
            on="date",
            direction="nearest"
        )
        
        # Add cloud coverage information from original NDVI data
        merged_data = pd.merge_asof(
            merged_data.sort_values("date"),
            ndvi_with_clouds[["date", "cloudCoveragePercent"]].sort_values("date"),
            on="date",
            direction="nearest"
        )
        
        if len(merged_data) == 0:
            raise ValueError("No data remaining after merging datasets")
            
        # Rename columns for clarity
        merged_data = merged_data.rename(columns={
            "mean_vh": "VH",
            "mean_vv": "VV",
            "mean": "ndvi"
        })
            
        return merged_data[["date", "VH", "VV", "ndvi", "cloudCoveragePercent"]]
        
    except Exception as e:
        logger.error(f"Error in create_data: {str(e)}")
        raise

def handle_cloud_coverage_and_predict(data: pd.DataFrame, cloud_threshold: float) -> pd.DataFrame:
    """
    Handle cloud coverage and make predictions.
    """
    try:
        # Create a copy to avoid modifying the input
        result = data.copy()
        
        # Ensure required columns exist
        if "cloudCoveragePercent" not in result.columns:
            raise ValueError("'cloudCoveragePercent' column not found in data")

        # Identify rows based on cloud threshold
        cloud_exceed_rows = result['cloudCoveragePercent'] > cloud_threshold
        
        # Predict NDVI for rows exceeding cloud threshold
        if cloud_exceed_rows.any():
            result.loc[cloud_exceed_rows, 'predicted_ndvi'] = classifier.predict(
                result.loc[cloud_exceed_rows, ['VH', 'VV']]
            )
        
        # Use actual NDVI values for rows within the cloud threshold
        result.loc[~cloud_exceed_rows, 'predicted_ndvi'] = result.loc[~cloud_exceed_rows, 'ndvi']
        
        # Add prediction type flag
        result['prediction_type'] = 'actual'
        result.loc[cloud_exceed_rows, 'prediction_type'] = 'predicted'
        
        return result
        
    except Exception as e:
        logger.error(f"Error in handle_cloud_coverage_and_predict: {str(e)}")
        raise