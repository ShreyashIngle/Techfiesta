from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any, Union
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv
import json
import openai
import os

load_dotenv()

# Configure OpenAI
openai.api_type = "azure"
openai.api_key = os.getenv("OPENAI_API_KEY")
openai.api_base = os.getenv("OPENAI_API_BASE")
openai.api_version = os.getenv("OPENAI_API_VERSION")

if not openai.api_key:
    raise ValueError("OPENAI_API_KEY is missing from the .env file!")

# Initialize FastAPI
app = FastAPI()

# Get the current directory
current_dir = Path(__file__).parent

# Load JSON files with proper encoding
try:
    # Use Path to handle file paths correctly
    generalized_path = current_dir / "content" / "generalized_resources.json"
    bias_path = current_dir / "content" / "tech_harvestors_ai_bias.json"
    
    # Open files with UTF-8 encoding
    with open(generalized_path, 'r', encoding='utf-8') as file:
        generalized = json.load(file)
    
    with open(bias_path, 'r', encoding='utf-8') as file:
        aiBiasChecklist = json.load(file)
        
    print("Successfully loaded JSON files")
except Exception as e:
    print(f"Error loading JSON files: {e}")
    generalized = {}
    aiBiasChecklist = {}

class CropPlanningRequest(BaseModel):
    previous_crops: str
    land_size: float
    land_size_unit: str
    current_soil_condition: Optional[str]
    water_availability: str
    preferred_crops: Optional[str]
    region_climate: str
    historical_pest_disease: Optional[str]
    fertilization_history: Optional[str]
    expected_yield_goals: Optional[str]

def get_completion(prompt: str, engine: str = "GPT4OAISpeaking") -> str:
    try:
        messages = [{"role": "user", "content": prompt}]
        response = openai.ChatCompletion.create(
            engine=engine,
            messages=messages,
            temperature=0.0
        )
        return response.choices[0].message["content"]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error in OpenAI API call: {str(e)}")

def cropRotationFeature(request: CropPlanningRequest) -> str    :
    delimiter = "####"
    prompt = f"""
  {delimiter}
  You are an intelligent agricultural consultant specializing in sustainable farming and precision agriculture. Your task is to provide scientifically backed, data-driven crop rotation recommendations based on the farmer's land, soil, and climatic conditions. Your responses should be expert-level, actionable, and tailored for optimal agricultural productivity.
  {delimiter}

  INPUT PARAMETERS: Find the condensed information from the farmer which has the following input parameters. Condensed in a json format.
  {request.previous_crops}, {request.land_size}, {request.land_size_unit}, {request.current_soil_condition}, {request.water_availability}, {request.preferred_crops}, {request.region_climate}, {request.historical_pest_disease}, {request.fertilization_history}, {request.expected_yield_goals}
  Ensure high accuracy in crop rotation recommendations by utilizing the following parameters explained in both English and Hindi(The equal numbers from the two have the same meaning in different languages):

      {delimiter}
      In English :
      1. Previous Crop(s) Grown (Required): Analyze the last season’s crop to determine soil nutrient depletion and possible disease carryover. Example values: Wheat, Rice, Maize, Soybeans.

      2. Soil Type (Required, if AI cannot detect it automatically): Soil type influences water retention, nutrient availability, and crop suitability. Example values: Sandy, Clay, Loamy, Silt, Peat.

      3. Land Size (Required): Helps determine the scale of crop production and potential yield management strategies. Example values: 1 acre, 10 hectares.

      4. Current Soil Condition (Optional but Recommended): If the farmer provides NPK levels and pH, recommendations will be more precise. If not, assume standard nutrient depletion patterns based on the previous crop.

      5. Water Availability (Required): Determines whether the land is rain-fed or has access to irrigation, affecting crop suitability. Example values: Irrigated, Rain-fed.

      6. Preferred Crops (Optional): If the farmer has specific crop preferences due to market demand or local needs, balance preferences with optimal choices.

      7. Region & Climate Conditions (Required): Auto-fetch real-time climate data based on GPS location or accept manual inputs for accuracy. Example values: Temperate, Tropical, Arid, Humid.

      8. Historical Pest & Disease Data (Optional but Recommended): Identifies past occurrences of pests or diseases that could impact crop rotation decisions.

      9. Fertilization History (Optional but Recommended): Tracks past fertilizer applications to avoid nutrient imbalances. Example values: "Used synthetic fertilizers last season," "Applied organic compost."

      10. Expected Yield Goals (Optional but Useful): Helps tailor recommendations to maximize productivity based on farmer expectations. Example values: "High yield priority," "Balanced yield and sustainability."
      {delimiter}
      {delimiter}
      In Hindi :
      1. पिछली फसल (आवश्यक): पिछली फसल का विश्लेषण करें ताकि मिट्टी के पोषक तत्वों की कमी और संभावित रोग प्रसार को समझा जा सके। उदाहरण: गेहूं, धान, मक्का, सोयाबीन।

      2. मिट्टी का प्रकार (आवश्यक, यदि AI इसे स्वचालित रूप से पता नहीं लगा सकता है): मिट्टी का प्रकार जल धारण, पोषक तत्व उपलब्धता और फसल उपयुक्तता को प्रभावित करता है। उदाहरण: रेतीली, चिकनी, दोमट, गाद, पीट।

      3. भूमि का आकार (आवश्यक): यह फसल उत्पादन और संभावित उपज प्रबंधन रणनीतियों के पैमाने को निर्धारित करने में मदद करता है। उदाहरण: 1 एकड़, 10 हेक्टेयर।

      4. वर्तमान मिट्टी की स्थिति (वैकल्पिक लेकिन अनुशंसित): यदि किसान NPK स्तर और pH प्रदान करता है, तो सिफारिशें अधिक सटीक होंगी। यदि नहीं, तो पिछली फसल के आधार पर मानक पोषक तत्व कमी पैटर्न मान लें।

      5. जल उपलब्धता (आवश्यक): यह निर्धारित करता है कि भूमि वर्षाजल सिंचित है या सिंचाई की सुविधा है, जो फसल उपयुक्तता को प्रभावित करता है। उदाहरण: सिंचित, वर्षाजल आधारित।

      6. पसंदीदा फसलें (वैकल्पिक): यदि किसान के पास बाज़ार की मांग या स्थानीय आवश्यकताओं के कारण विशेष फसल प्राथमिकताएँ हैं, तो प्राथमिकताओं को इष्टतम विकल्पों के साथ संतुलित करें।

      7. क्षेत्र एवं जलवायु परिस्थितियाँ (आवश्यक): GPS स्थान के आधार पर वास्तविक समय की जलवायु डेटा स्वचालित रूप से प्राप्त करें या सटीकता के लिए मैन्युअल इनपुट स्वीकार करें। उदाहरण: समशीतोष्ण, उष्णकटिबंधीय, शुष्क, आर्द्र।

      8. ऐतिहासिक कीट एवं रोग डेटा (वैकल्पिक लेकिन अनुशंसित): पिछली घटनाओं की पहचान करें जो फसल चक्र निर्णयों को प्रभावित कर सकती हैं।

      9. उर्वरक इतिहास (वैकल्पिक लेकिन अनुशंसित): पोषक तत्व असंतुलन से बचने के लिए पिछले उर्वरक अनुप्रयोगों को ट्रैक करें। उदाहरण: "पिछले मौसम में सिंथेटिक उर्वरक का उपयोग किया गया," "जैविक खाद डाली गई।"

      10. अपेक्षित उपज लक्ष्य (वैकल्पिक लेकिन उपयोगी): किसान की अपेक्षाओं के आधार पर उत्पादकता को अधिकतम करने के लिए सिफारिशें देने में मदद करता है। उदाहरण: "उच्च उपज प्राथमिकता," "संतुलित उपज और स्थिरता।"
      {delimiter}
  OUTPUT REQUIREMENTS:
  While creating the output, always refer to the json file which has all the agricultural resources : ```{generalized}```. You can also refer to your own knowledge, but make sure it is viable and correct.
  Combine these knowledge brackets to give a proper output. Never give the information that is incorrect with respect to the Agricultural and farmer practices or known methods.
      {delimiter}
      In English :
      1. Generate well-structured, actionable insights for the farmer, ensuring clarity and usability.

      2. Best Next Crop Recommendation: Provide a scientifically backed suggestion for the most beneficial next crop, considering soil health and sustainability. Example: "Since you grew wheat last season, you should plant chickpeas next to restore nitrogen levels."

      3. Alternative Crop Choices: A list of secondary recommendations based on market demand, water availability, and land size.

      4. Why This Crop?: A clear explanation highlighting soil benefits, potential yield, and economic advantages.

      5. Step-by-Step Farming Guide: A structured timeline for sowing, irrigation, fertilization, and harvesting, ensuring the farmer understands the complete process.

      6. Soil Fertility Improvement Tips: If the soil is depleted, provide recommendations for organic manure, crop rotation techniques, and soil health restoration practices.

      7. Long-Term Crop Rotation Plan: A 3-4 season rotational plan to enhance sustainability and prevent soil degradation, along with the reason for each of the season.
      {delimiter}
      {delimiter}
      In Hindi:
      1. सर्वश्रेष्ठ अगली फसल की सिफारिश: मिट्टी के स्वास्थ्य और स्थिरता को ध्यान में रखते हुए, वैज्ञानिक रूप से समर्थित सुझाव प्रदान करें। उदाहरण: "चूंकि आपने पिछले सीजन में गेहूं उगाया था, इसलिए मिट्टी में नाइट्रोजन स्तर बहाल करने के लिए चना उगाना चाहिए।"

      2. वैकल्पिक फसल विकल्प: बाज़ार की मांग, जल उपलब्धता और भूमि आकार के आधार पर द्वितीयक सिफारिशों की सूची।

      3. क्यों यह फसल?: मिट्टी के लाभ, संभावित उपज और आर्थिक लाभ को उजागर करने वाला एक स्पष्ट स्पष्टीकरण।

      4. चरण-दर-चरण कृषि मार्गदर्शिका: बुवाई, सिंचाई, उर्वरक प्रबंधन और कटाई के लिए एक संरचित समयरेखा प्रदान करें।

      5. मिट्टी की उर्वरता सुधारने के सुझाव: यदि मिट्टी पोषक तत्वों से रहित है, तो जैविक खाद, फसल चक्र तकनीकों और मिट्टी के स्वास्थ्य बहाली प्रथाओं की सिफारिश करें।

      6. दीर्घकालिक फसल चक्र योजना: स्थिरता बढ़ाने और मिट्टी के क्षरण को रोकने के लिए 3-4 मौसम की घूर्णन योजना।
      {delimiter}

  GOAL:
  {delimiter}
  Enhance agricultural sustainability by optimizing crop rotation strategies. Leverage AI-driven decision-making to help farmers maximize yields, maintain soil fertility, and improve long-term productivity.
  {delimiter}

  OBJECTIVES:

      {delimiter}
      1. Increase soil health awareness and sustainable farming practices.

      2. Improve yield outcomes by optimizing crop selection.

      3. Reduce soil depletion and minimize chemical fertilizer dependency.

      4. Enhance economic benefits by aligning crop selection with market trends.

      5. Provide user-friendly, data-driven agricultural insights through AI.
      {delimiter}

  TONE/MANNER:
  Ensure communication is:

      {delimiter}
      Always give the output in Hindi, even if the user's inputs are in some other language. Understand the inputs. Make sure you use correct grammar for the same. Your tone should be polite and willing to provide as much information as you can that is applied in the real world.

      1. Simple and clear for farmers of all education levels.

      2. Insightful and scientific to establish credibility.

      3. Actionable with clear, step-by-step guidance.

      4. Engaging and practical for effective implementation.
      {delimiter}

  OUTPUT FORMAT(JSON):
{
{
  "अगली_फसल": "चना",
  "वैकल्पिक_फसलें": ["मसूर", "मटर", "सरसों"],
  "कारण": "चना मिट्टी में नाइट्रोजन को पुनर्स्थापित करता है, जिससे गेहूं की खेती के बाद पोषक तत्वों की कमी नहीं होती. (At least 50 words explanation, including reasoning and examples.)",
  "कृषि_मार्गदर्शिका": {
    "बुवाई_समय": "नवंबर की शुरुआत (At least 50 words with detailed explanation.)",
    "सिंचाई_आवश्यकताएँ": "प्रारंभिक बुवाई के बाद न्यूनतम सिंचाई की आवश्यकता होती है. (At least 50 words explanation, covering reasons and impact.)",
    "उर्वरक": "इष्टतम वृद्धि के लिए जैविक खाद और जैविक उर्वरकों का उपयोग करें. (At least 50 words detailing guidance and benefits.)",
    "कटाई_समय": "अप्रैल के मध्य (At least 30 words explaining the process and precautions.)",
    "कीट_नियंत्रण": "एफिड्स के लिए निगरानी करें; नीम आधारित जैविक कीटनाशकों का उपयोग करें. (At least 60 words explaining strategies and preventive measures.)"
  },
  "मिट्टी_उर्वरता_सुझाव": "बुवाई से पहले हरी खाद का उपयोग करें और नाइट्रोजन-फिक्सिंग फसल के साथ चक्र करें. (At least 80 words explaining the process and its benefits.)",
  "दीर्घकालिक_योजना": {
    "मौसम_1": {
      "फसल": "चना",
      "कारण": "मिट्टी में नाइट्रोजन बढ़ाने और गेहूं की खेती को समर्थन देने के लिए. (At least 50 words explaining crop rotation importance and benefits.)",
      "पानी_की_आवश्यकता": "कम से मध्यम (At least 30 words explaining water needs.)",
      "संभावित_रोग": ["जड़ सड़न", "चूर्णी फफूंदी"],
      "सहायक_फसलें": ["गेहूं", "सरसों"],
      "संरक्षण_तकनीकियाँ": "ठंडी और सूखी जगह में भंडारण करें. (At least 30 words explaining preservation methods.)"
    },
    "मौसम_2": {
      "फसल": "मक्का",
      "कारण": "मक्का मिट्टी की संरचना को बनाए रखने में मदद करता है और विविधीकरण में सहायक है. (At least 50 words providing detailed information.)",
      "पानी_की_आवश्यकता": "उच्च (At least 30 words explaining water needs.)",
      "संभावित_रोग": ["जीवाणु झुलसा", "मक्के का कंडुआ"],
      "सहायक_फसलें": ["अरहर", "राजमा"],
      "संरक्षण_तकनीकियाँ": "सूखी जगह में रखकर नमी से बचाएं. (At least 30 words explaining preservation methods.)"
    },
    "मौसम_3": {
      "फसल": "सोयाबीन",
      "कारण": "सोयाबीन नाइट्रोजन-फिक्सिंग फसल है, जिससे मिट्टी की उर्वरता में सुधार होता है. (At least 50 words covering its impact and advantages.)",
      "पानी_की_आवश्यकता": "मध्यम (At least 30 words explaining water needs.)",
      "संभावित_रोग": ["झुलसा रोग", "फफूंदी"],
      "सहायक_फसलें": ["मक्का", "गन्ना"],
      "संरक्षण_तकनीकियाँ": "शुष्क वातावरण में संग्रह करें. (At least 30 words explaining preservation methods.)"
    },
    "मौसम_4": {
      "फसल": "गेहूं",
      "कारण": "गेहूं स्थिर उत्पादन सुनिश्चित करता है और पिछली फसलों की पोषण आवश्यकताओं का संतुलन बनाए रखता है. (At least 50 words explaining its relation with other crops and effects.)",
      "पानी_की_आवश्यकता": "मध्यम (At least 30 words explaining water needs.)",
      "संभावित_रोग": ["कंडुआ रोग", "रस्ट रोग"],
      "सहायक_फसलें": ["चना", "मसूर"],
      "संरक्षण_तकनीकियाँ": "ठंडी और हवादार जगह में संग्रह करें. (At least 30 words explaining preservation methods.)"
    }
  }
}
}
  """

    return prompt

def checkForAIHallucincations(pre_final_output: str) -> str:
    delimiter = "####"
    prompt = f"""
भूमिका:
आप एक विशेषज्ञ कृषि सलाहकार और पर्यवेक्षक हैं, जो आधुनिक और सतत कृषि पद्धतियों, फसल चक्रण (Crop Rotation), मृदा स्वास्थ्य प्रबंधन और जलवायु-लचीली खेती में गहरी जानकारी रखते हैं। आपका कार्य नीचे दिए गए कृषि फसल चक्रण योजना का मूल्यांकन करना है।

कार्य:
आपको एक फसल चक्रण योजना दी जाएगी। आपका कार्य है:
1. जाँच करें कि दी गई योजना आधुनिक और वैज्ञानिक रूप से मान्य कृषि पद्धतियों के अनुसार है या नहीं।
2. यह सुनिश्चित करें कि योजना में कोई **गलत जानकारी, पूर्वाग्रह (Bias) या कल्पित तथ्य (Hallucination)** न हो।
3. यह सुनिश्चित करें कि यह योजना **अस्थिर कृषि विधियों, अवास्तविक सिफारिशों या क्षेत्र-विशिष्ट असंगतताओं** को बढ़ावा न दे।
4. नीचे दी गई पूर्वाग्रह जाँच सूची के अनुसार योजना का मूल्यांकन करें।
5. यदि किसी भी पूर्वाग्रह या गलत जानकारी का पता चलता है, तो **फसल चक्रण योजना न दिखाएं** और केवल पूर्वाग्रह मूल्यांकन (Bias Evaluation) का JSON उत्तर दें।
6. यदि योजना बिना किसी पूर्वाग्रह के सही पाई जाती है, तो **मूल योजना के साथ मूल्यांकन परिणाम को JSON स्वरूप में लौटाएँ।**

**इनपुट (फसल चक्रण योजना)**
{pre_final_output}

---

**पूर्वाग्रह और कल्पित जानकारी (Hallucination) मूल्यांकन मापदंड:**
You can also refer to this json file : `{aiBiasChecklist}`
नीचे दी गई जाँच सूची का उपयोग करके फसल चक्रण योजना का मूल्यांकन करें:

1. **कल्पना पूर्वाग्रह (Hallucination Bias)** - क्या योजना में ऐसे फसल, तकनीक, या कृषि विधियाँ सुझाई गई हैं जो वैज्ञानिक रूप से प्रमाणित नहीं हैं?
2. **गलत व्याख्या पूर्वाग्रह (Misinterpretation Bias)** - क्या योजना में मिट्टी, मौसम, या कृषि डेटा की गलत व्याख्या की गई है?
3. **डेटा पूर्वाग्रह (Data Bias)** - क्या यह योजना केवल बड़े पैमाने पर औद्योगिक खेती को प्राथमिकता देती है और छोटे किसानों की अनदेखी करती है?
4. **तकनीकी पूर्वाग्रह (Technological Bias)** - क्या इसमें महंगे उपकरण, इंटरनेट या अत्याधुनिक तकनीक की आवश्यकता मानी गई है?
5. **आर्थिक पूर्वाग्रह (Economic Bias)** - क्या यह योजना केवल उच्च निवेश वाले किसानों के लिए अनुकूल है?
6. **पर्यावरणीय पूर्वाग्रह (Environmental Bias)** - क्या योजना में स्थानीय मिट्टी की स्थिति, जलवायु और जैव विविधता का ध्यान रखा गया है?
7. **भाषा और संचार पूर्वाग्रह (Language and Communication Bias)** - क्या योजना में कठिन या जटिल भाषा का उपयोग किया गया है जो कम साक्षर किसानों के लिए बाधा बन सकती है?
8. **न्याय और समावेशी पूर्वाग्रह (Fairness and Inclusivity Bias)** - क्या योजना में महिला किसानों, पारंपरिक कृषि विधियों या स्वदेशी ज्ञान की उपेक्षा की गई है?
9. **सेंसर और डेटा विश्वसनीयता पूर्वाग्रह (Sensor and Data Reliability Bias)** - क्या योजना उपग्रह या आईओटी डेटा पर आँख मूंदकर भरोसा कर रही है, बिना क्षेत्रीय सत्यापन के?
10. **निर्णय लेने का पूर्वाग्रह (Decision-Making Bias)** - क्या योजना कृषि निर्णयों को बहुत सरल बना रही है और क्षेत्रीय नीतियों को नजरअंदाज कर रही है?
11. **अनिश्चितता और आत्मविश्वास अंशांकन पूर्वाग्रह (Uncertainty and Confidence Calibration Bias)** - क्या योजना अनिश्चित दावों को पूर्ण सत्य के रूप में प्रस्तुत कर रही है?

---

**उत्तर स्वरूप (Response Format)**
आपको नीचे दिए गए दो अनुभागों के साथ JSON स्वरूप में उत्तर देना होगा:

1. `"मूल_इनपुट"`: इसमें दी गई **फसल चक्रण योजना का वही इनपुट** शामिल होगा।
2. `"पूर्वाग्रह_मूल्यांकन"`: इसमें प्रत्येक पूर्वाग्रह की जाँच के लिए `"Y"` (पूर्वाग्रह नहीं मिला) या `"N"` (पूर्वाग्रह मिला) होना चाहिए।

**यदि कोई पूर्वाग्रह (`"N"`) पाया जाता है, तो `"मूल_इनपुट"` नहीं दिखाना है और केवल `"पूर्वाग्रह_मूल्यांकन"` लौटाना है।**

---

**यदि योजना बिना पूर्वाग्रह के सही है:**
{{
    "मूल_इनपुट": "pre_final_output",
    "पूर्वाग्रह_मूल्यांकन": {{
        "कल्पना_पूर्वाग्रह": "Y",
        "गलत_व्याख्या_पूर्वाग्रह": "Y",
        "डेटा_पूर्वाग्रह": "Y",
        "तकनीकी_पूर्वाग्रह": "Y",
        "आर्थिक_पूर्वाग्रह": "Y",
        "पर्यावरणीय_पूर्वाग्रह": "Y",
        "भाषा_और_संचार_पूर्वाग्रह": "Y",
        "न्याय_और_समावेशी_पूर्वाग्रह": "Y",
        "सेंसर_और_डेटा_विश्वसनीयता_पूर्वाग्रह": "Y",
        "निर्णय_लेने_का_पूर्वाग्रह": "Y",
        "अनिश्चितता_और_आत्मविश्वास_अंशांकन_पूर्वाग्रह": "Y"
    }}
}}
  """

    return prompt

@app.post("/generate_rotation", response_model=Dict[str, Any])
async def generate_rotation(request: CropPlanningRequest):
    try:
        # Step 1: Generate initial report
        rotation_prompt = cropRotationFeature(request)
        initial_report = get_completion(rotation_prompt)
        print("Generated initial report")

        # Step 2: Check for hallucinations
        hallucination_prompt = checkForAIHallucincations(initial_report)
        hallucination_check = get_completion(hallucination_prompt)
        print("Completed hallucination check")

        try:
            # Parse the hallucination check response
            hallucination_result = json.loads(hallucination_check)
            
            # Return both the original report and the hallucination check
            return {
                "rotation": initial_report,
                "hallucination_check": hallucination_result
            }
            
        except json.JSONDecodeError as e:
            print(f"Error parsing hallucination check: {e}")
            return {
                "report": initial_report,
                "hallucination_check": hallucination_check,
                "parse_error": "Could not parse hallucination check as JSON"
            }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing report: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)