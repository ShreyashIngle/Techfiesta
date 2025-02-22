from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from typing import Optional, List, Dict
import google.generativeai as genai
import os
import fitz
from datetime import datetime
import markdown
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle

# Initialize FastAPI
app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure Gemini API
GENAI_API_KEY = "AIzaSyDxO5dlN-W99qqnRaB5nxMoIFy_YPJTdts"  # Replace with your API key
genai.configure(api_key=GENAI_API_KEY)

# Constants for PDF generation
TEMPLATE_PATH = "template.pdf"  # Make sure this exists in your directory
OUTPUT_DIR = "output"
os.makedirs(OUTPUT_DIR, exist_ok=True)

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
    SoilPH: Optional[float] = 7.0
    SoilMoisture: Optional[float] = 0.0
    PestDisease: Optional[str] = None
    PrevCrop: Optional[str] = None
    indexData: Optional[dict] = None
    polygonCoordinates: Optional[list] = None

def format_gemini_response(text: str) -> dict:
    """Parse and format the Gemini response into sections."""
    sections = {
        'prediction': '',
        'analysis': '',
        'recommendations': '',
        'risks': ''
    }
    
    current_section = 'prediction'
    lines = text.split('\n')
    
    for line in lines:
        if 'Predicted' in line:
            sections['prediction'] = line.strip()
        elif 'Analysis Report' in line or 'Health Analysis Report' in line:
            current_section = 'analysis'
        elif 'Key Recommendations' in line or 'Critical Actions Required' in line:
            current_section = 'recommendations'
        elif 'Risk' in line:
            current_section = 'risks'
        elif line.strip():
            sections[current_section] += line.strip() + '\n'
    
    return sections

import markdown
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image
from reportlab.lib.enums import TA_LEFT, TA_RIGHT
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle

# Path to logo file (Ensure it's in the correct directory)
LOGO_PATH = "logo.png"  # Replace with your actual logo file path

def insert_text_into_pdf(text: str, report_type: str = "Yield") -> str:
    """Convert Markdown to formatted PDF with styles, add logo & timestamp."""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    current_time = datetime.now().strftime("%B %d, %Y %H:%M:%S")  # Date + Time
    output_path = os.path.join(OUTPUT_DIR, f"{report_type.lower()}report{timestamp}.pdf")

    # Convert Markdown to HTML
    sections = format_gemini_response(text)
    sections = {key: markdown.markdown(value) for key, value in sections.items()}

    # Set up PDF document
    doc = SimpleDocTemplate(output_path, pagesize=letter)
    elements = []
    styles = getSampleStyleSheet()

    # Custom Styles
    title_style = ParagraphStyle(
        "TitleStyle",
        parent=styles["Heading1"],
        fontSize=18,
        textColor=colors.darkblue,
        alignment=TA_LEFT,
        spaceAfter=12,
    )

    section_style = ParagraphStyle(
        "SectionStyle",
        parent=styles["Heading2"],
        fontSize=14,
        textColor=colors.green,
        alignment=TA_LEFT,
        spaceAfter=10,
    )

    body_style = ParagraphStyle(
        "BodyStyle",
        parent=styles["BodyText"],
        fontSize=12,
        textColor=colors.black,
        alignment=TA_LEFT,
        spaceAfter=8,
    )

    date_style = ParagraphStyle(
        "DateStyle",
        parent=styles["BodyText"],
        fontSize=11,
        textColor=colors.grey,
        alignment=TA_LEFT,
        spaceAfter=8,
    )

    # Add Logo (Top Right Corner)
    if os.path.exists(LOGO_PATH):
        logo = Image(LOGO_PATH, width=1.5 * inch, height=1.5 * inch)
        logo.hAlign = "RIGHT"
        elements.append(logo)

    # Add Title
    elements.append(Paragraph(f"Crop {report_type} Analysis Report", title_style))
    elements.append(Spacer(1, 0.2 * inch))

    # Add Date & Time
    elements.append(Paragraph(f"Generated on: {current_time}", date_style))
    elements.append(Spacer(1, 0.3 * inch))

    # Add Sections
    for section, content in sections.items():
        elements.append(Paragraph(section.replace("_", " ").title(), section_style))
        elements.append(Paragraph(content, body_style))
        elements.append(Spacer(1, 0.3 * inch))

    # Save PDF
    doc.build(elements)
    return output_path



@app.get("/")
async def root():
    return {"message": "FastAPI Backend Running"}

@app.post("/yield")
async def predictYield(data: CropData):
    try:
        print("Received Data:", data.dict())

        # Extract satellite indices safely
        index_data = data.indexData
        evi = index_data.get("evi", {}).get("median", "N/A")
        evi2 = index_data.get("evi2", {}).get("median", "N/A")
        nri = index_data.get("nri", {}).get("median", "N/A")
        dswi = index_data.get("dswi", {}).get("median", "N/A")
        ndwi = index_data.get("ndwi", {}).get("median", "N/A")
        ndvi = index_data.get("ndvi", {}).get("median", "N/A")

        # Enhanced AI Prompt
        prompt = f"""
        You are an expert agricultural AI model specializing in precision agriculture, agronomy, and crop yield prediction. 
        Analyze the following data comprehensively to provide accurate yield predictions and recommendations.

        ### Input Data Analysis:
        If any input data is null or 0, ignore that field

        🌱 Crop Information:
        - Crop Type: {data.selectedCrop}
        - Sowing Date: {data.sowingDate}
        - Previous Crop: {data.PrevCrop}
        - Location: {data.polygonCoordinates}

        🌍 Soil & Water Metrics:
        - Soil Type: {data.selectedSoil}
        - Soil pH: {data.SoilPH}
        - Soil Moisture: {data.SoilMoisture}%
        - Irrigation Method: {data.selectedIrrig}
        - Fertilizer Application: {data.fertilizer} kg/ha

        📊 Vegetation Indices:
        - EVI: {evi}
        - EVI2: {evi2}
        - NRI: {nri}
        - DSWI: {dswi}
        - NDWI: {ndwi}
        - NDVI: {ndvi}

        📈 Historical Yields:
        - 2024: {data.yield2024} kg/ha
        - 2023: {data.yield2023} kg/ha
        - 2022: {data.yield2022} kg/ha

        🐛 Health Factors:
        - Pest/Disease Issues: {data.PestDisease}

        ### Required Output:

        *Predicted Yield 2025:*
        [Provide yield in kg/ha]
        [Include confidence range ±10%]

        *Detailed Analysis Report (200 words):*
        [Comprehensive analysis covering:
        - Current field conditions
        - Impact of soil and vegetation indices
        - Historical yield trends
        - Key limiting factors
        - Weather considerations]

        *Key Recommendations:*
        • [Immediate actions (next 30 days)]
        • [Mid-term strategies (current season)]
        • [Long-term improvements]
        • [Specific fertilizer/irrigation adjustments]
        • [Sustainability practices]

        *Risk Assessment:*
        • [Potential threats to yield]
        • [Mitigation strategies]
        """

        # Call Gemini API
        model = genai.GenerativeModel("gemini-pro")
        response = model.generate_content(prompt)
        
        # Generate PDF
        pdf_path = insert_text_into_pdf(response.text, "Yield")
        
        # Return PDF for download
        return FileResponse(
            pdf_path,
            media_type="application/pdf",
            filename=os.path.basename(pdf_path),
            headers={"Content-Disposition": f"attachment; filename={os.path.basename(pdf_path)}"}
        )

    except Exception as e:
        return {"error": "Internal Server Error", "message": str(e)}

@app.post("/health")
async def predictHealth(data: CropData):
    try:
        print("Received Data for Health:", data.dict())

        # Extract satellite indices safely
        index_data = data.indexData
        evi = index_data.get("evi", {}).get("median", "N/A")
        evi2 = index_data.get("evi2", {}).get("median", "N/A")
        nri = index_data.get("nri", {}).get("median", "N/A")
        dswi = index_data.get("dswi", {}).get("median", "N/A")
        ndwi = index_data.get("ndwi", {}).get("median", "N/A")
        ndvi = index_data.get("ndvi", {}).get("median", "N/A")

        # Enhanced AI Prompt for Health
        prompt = f"""
        You are an expert agricultural AI model specializing in precision agriculture, crop health assessment, and disease management. 
        Analyze the following data comprehensively to evaluate crop health and provide targeted recommendations.

        ### Input Data Analysis:
        If any input data is null or 0, ignore that field

        🌱 Crop Information:
        - Crop Type: {data.selectedCrop}
        - Sowing Date: {data.sowingDate}
        - Previous Crop: {data.PrevCrop}
        - Location: {data.polygonCoordinates}

        🌍 Growing Conditions:
        - Soil Type: {data.selectedSoil}
        - Soil pH: {data.SoilPH}
        - Soil Moisture: {data.SoilMoisture}%
        - Irrigation Method: {data.selectedIrrig}
        - Fertilizer Application: {data.fertilizer} kg/ha

        📊 Health Indicators:
        - EVI: {evi}
        - EVI2: {evi2}
        - NRI: {nri}
        - DSWI: {dswi}
        - NDWI: {ndwi}
        - NDVI: {ndvi}

        📈 Historical Performance:
        - 2024 Yield: {data.yield2024} kg/ha
        - 2023 Yield: {data.yield2023} kg/ha
        - 2022 Yield: {data.yield2022} kg/ha

        🐛 Known Issues:
        - Pest/Disease Presence: {data.PestDisease}

        ### Required Output:

        *Current Crop Health Score:*
        [Provide health rating as percentage]
        [Include confidence range ±5%]

        *Health Analysis Report (200 words):*
        [Comprehensive analysis covering:
        - Current plant health status
        - Disease/pest risk assessment
        - Nutritional status
        - Stress indicators
        - Growth stage evaluation]

        *Critical Actions Required:*
        • [Immediate interventions needed]
        • [Disease/pest management steps]
        • [Nutrition management]
        • [Stress mitigation strategies]
        • [Preventive measures]

        *Risk Factors:*
        • [Current threats to crop health]
        • [Potential future risks]
        • [Environmental stress factors]
        • [Prevention strategies]
        """

        # Call Gemini API
        model = genai.GenerativeModel("gemini-pro")
        response = model.generate_content(prompt)
        
        # Generate PDF
        pdf_path = insert_text_into_pdf(response.text, "Health")
        
        # Return PDF for download
        return FileResponse(
            pdf_path,
            media_type="application/pdf",
            filename=os.path.basename(pdf_path),
            headers={"Content-Disposition": f"attachment; filename={os.path.basename(pdf_path)}"}
        )

    except Exception as e:
        return {"error": "Internal Server Error", "message": str(e)}