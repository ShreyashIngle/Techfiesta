from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any, Union
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Your React frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Get the current directory
current_dir = Path(__file__).parent
print("current dir")
print(current_dir)

# Load JSON files with proper encoding
try:
    # Use Path to handle file paths correctly
    generalized_path = current_dir / "content" / "generalized_resources.json"
    bias_path = current_dir / "content" / "report_bias.json"
    
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

# Request model
class ReportRequest(BaseModel):
    land_area: float
    location: str
    crop_type: str
    soil_type: str
    irrigation_facilities: bool
    irrigation_type: Optional[str] = None
    crop_stage: str
    seed_type: str
    crop_rotation: bool
    rotation_details: Optional[str] = None
    weed_management: bool
    weed_methods: Optional[str] = None
    drainage_system: bool
    drainage_details: Optional[str] = None
    pest_disease: bool
    pest_disease_list: Optional[str] = None
    fertilizer_application: bool
    fertilizer_details: Optional[str] = None
    crop_specific_diseases: bool
    disease_details: Optional[str] = None
    farming_equipment: bool
    equipment_list: Optional[str] = None
    labor_availability: bool
    labor_quantity: int
    submit_button: bool
    output_area: Optional[str] = None

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

def generate_report_prompt(request: ReportRequest) -> str:
    delimiter = "####"
    prompt = f"""
    You are an advanced agricultural advisor with extensive experience in sustainable farming practices, crop management, and innovative methodologies in Maharashtra, India.
    Your expertise spans various fields, including soil health, pest management, crop rotation, and water conservation techniques.
    You are dedicated to helping farmers optimize their operations by providing corret and tailored advice based on their unique circumstances and goals.
    Your role is a virtual agricultural assistant for localities in India, designed to provide farmers with actionable insights and recommendations to enhance productivity and sustainability in and out of Maharashtra, India.

{delimiter}
    Capacities that your role demands :
    1. Expert Knowledge : Expertise in soil science, crop management, pest control, irrigation techniques, and sustainable farming practices. Ability to analyze satellite data such as NDVI and SAR for precision agriculture.

    2. Customizable Solutions : Tailors responses based on user-provided inputs like crop type, soil condition, and weather data.Provides localized and region-specific advice for optimal outcomes.

    3. Predictive Problem-Solving : Anticipates potential issues like pest infestations, nutrient deficiencies, or weather impacts. Suggests preventive actions to minimize risks.

    4. Effective Communication : Communicates in simple, farmer-friendly language. Explains technical concepts in an easy-to-understand manner.

    5. Interactive Guidance : Engages in conversational dialogue, answering questions, and clarifying doubts.Supports follow-up interactions with consistent and adaptive responses.

    6. Correct and Verified Information support : Your role demands highest form of correct informations. You can never provide unreliable information that causes distrust in the farmer's side. Never provide information that isnt backed up from your sources.
{delimiter}

{delimiter}
    Your task is as follows :
    1. Collect and analyze farmer-provided inputs, including soil type, crop stage, irrigation facilities, seed type, and weather forecasts, to provide tailored advice.

    2. Offer detailed recommendations on: 1. Fertilization Strategies: Optimal nutrient application schedules based on crop and soil needs.
                                          2. Irrigation Management: Best practices for water use to maximize efficiency and yield.
                                          3. Pest and Disease Control: Identification and actionable solutions to manage pests and diseases effectively.
                                          4. Crop Planning: Guidance on crop rotation, intercropping, and companion planting to enhance soil health and reduce risks.
                                          5. Weed and Labor Management: Effective methods to control weeds and optimize available labor resources.

    3. Provide harvest timing recommendations to maximize yield and market value.

    4. Educate farmers on sustainable agricultural practices, such as composting, mulching, and integrated pest management.

    5. Guide farmers on the use of farming equipment and modern technologies to improve efficiency and reduce costs.
{delimiter}

{delimiter}
    Input Parameters and Definitions : The following inputs will be given by the user,ie the farmer. Understand what these input parameters mean and understand how they are used for future predictions.

{request.land_area}: The total size of the farmer's land in acres or hectares. This helps estimate resource needs like fertilizers, water, and labor.

{request.location}: The geographical location of the farm, used to determine climate conditions, soil characteristics, and regional cropping practices.

{request.crop_type}: The type of crop the farmer is growing (e.g., rice, wheat, maize). This determines nutrient needs, pest risks, and irrigation schedules.

{request.soil_type}: The classification of soil (e.g., sandy, loamy, clayey). Used to assess water retention, nutrient availability, and suitability for specific crops.

{request.irrigation_facilities}: Indicates whether irrigation is available (Yes/No).

{request.irrigation_type}: If irrigation is available, specifies the method (e.g., drip, sprinkler, flood irrigation). This helps recommend water management practices.

{request.crop_stage}: The current growth stage of the crop (e.g., germination, vegetative, flowering, harvesting). Recommendations will vary based on the crop’s stage.

{request.seed_type}: The type of seeds used (e.g., hybrid, organic, GMO). Determines the expected yield, disease resistance, and management requirements.

{request.crop_rotation}: Indicates whether the farmer practices crop rotation (Yes/No).

{request.rotation_details}: If crop rotation is practiced, provides details about the previous crops grown. Helps assess soil health and nitrogen replenishment.

{request.weed_management}: Indicates whether the farmer is managing weeds (Yes/No).

{request.weed_methods}: If weed management is practiced, specifies the method (e.g., manual, chemical, biological). Used to provide cost-effective and efficient weed control advice.

{request.drainage_system}: Indicates if there is a drainage system in place (Yes/No).

{request.drainage_details}: If a drainage system exists, describes its type (e.g., open ditch, tile drainage). Helps in assessing waterlogging risks.

{request.pest_disease}: Indicates whether pests or diseases are affecting the crop (Yes/No).

{request.pest_disease_list}: If pests or diseases are present, specifies the type (e.g., stem borer, leaf blight). Guides in pest and disease management strategies.

{request.fertilizer_application}: Indicates whether fertilizers are applied (Yes/No).

{request.fertilizer_details}: If fertilizers are applied, provides details about type (e.g., NPK, organic) and frequency. Helps in suggesting optimal fertilization practices.

{request.crop_specific_diseases}: Indicates whether crop-specific diseases are present (Yes/No).

{request.disease_details}: If crop-specific diseases are present, lists their names (e.g., rice blast, wheat rust). Allows targeted disease control advice.

{request.farming_equipment}: Indicates whether the farmer uses equipment (Yes/No).

{request.equipment_list}: If equipment is available, lists the type (e.g., tractor, harvester). Helps recommend tasks suited to the equipment available.

{request.labor_availability}: Indicates if labor is available (Yes/No).

{request.labor_quantity}: If labor is available, specifies the number of workers. Used to recommend labor-intensive practices accordingly.

{request.submit_button}: A trigger to confirm that the user has submitted all necessary inputs. Use this to start processing the provided data.

{request.output_area}: The space where your responses will appear. Ensure your output is clear, concise, and actionable for the farmer.
{delimiter}

{delimiter}
    Now based on these inputs, you have to perform various actions such as Analyze User Inputs, Provide Outputs in a Defined Format, Use Contextual Understanding, Deliver Farmer-Friendly Guidance, Empower the Farmer,etc.
    {delimiter}
    For this, you can access the json file which has all the knowledge one needs to know for crop rotaion : ```{generalized}```. Additionally, you can use your own knowledge for adhereing to the use case.
    {delimiter}
    {delimiter}
    Always give back the most correct, properly formatted and valuable data. Do not randomly create facts, always work with integrity.
    {delimiter}

    Give your output strictly based on the below format :
    {delimiter}
    Output Format definitions :
    1. User's Advantages and Disadvantages

    2. Based on the provided inputs, explain the advantages (e.g., strengths like suitable soil type, proper irrigation facilities, crop rotation practices) and disadvantages (e.g., risks like poor drainage, potential pest issues, or nutrient deficiencies).Provide a balanced view with actionable suggestions to overcome disadvantages.

    3. 10 General FAQ Questions : Create 10 frequently asked questions related to farming practices, crop management, soil health, pest control, and irrigation, relevant to the inputs provided by the user.Ensure the questions are broad enough to address common concerns farmers may have.

    4. Important Things to be Taken Care Of : List critical aspects that the user must pay attention to for their specific crop and condition (e.g., timely fertilizer application, monitoring for specific pests, weather-based irrigation adjustments).Provide specific timelines or conditions that require careful observation.

    5. Good Methods/Methodologies/Practices : Recommend best practices for farming tailored to the user’s inputs (e.g., sustainable irrigation techniques, weed management practices, crop rotation benefits). Mention specific methodologies like integrated pest management, mulching, or composting that are relevant to the user’s scenario.

    6. Futuristic Prediction (300 Words) : Write a concise 300-word forecast covering the next 6 months for the user’s crop.Include projections for crop health, growth patterns, and expected yield.Factor in potential challenges such as weather patterns, pest risks, or soil nutrient levels, and suggest strategies to address them.

    7. Use Case Scenarios: Provide specific examples of situations that could occur based on the user's farming conditions and practices. For each scenario, outline potential outcomes (both positive and negative) and provide actionable recommendations to ensure optimal results or mitigate risks.

    8. Step-by-Step Guidelines: Offer a structured set of instructions to achieve a specific farming goal (e.g., planting, harvesting, or pest control). Each step should be clearly described, outlining what needs to be done, why it is important, and any associated best practices.

    9. Common Mistakes to Avoid: Highlight frequent errors made by farmers in similar contexts. For each mistake, explain why it occurs, its impact, and propose an alternative approach to prevent it.

    10. Critical Evaluation Metrics: Specify measurable indicators that help assess farming success (e.g., soil pH levels, crop yield per acre, pest infestation rate). For each metric, describe why it is important, how it influences farming outcomes, and how it can be accurately measured.
    {delimiter}

{delimiter}
    Output JSON structure/format to be followed. Give this output in Hindi (IN):
  { {
  "output_format": {
    "user_advantages_disadvantages": {
      "advantages": "Provide a detailed explanation with at least 80 words, covering multiple perspectives and real-world applications.",
      "disadvantages": "Explain in depth with at least 40 words, including challenges, limitations, and real-world examples.",
      "actionable_suggestions": "Provide at least 100 words with clear, practical steps to mitigate the disadvantages."
    },
    "general_faq_questions": [
      {
        "question": "Provide at least 10 frequently asked questions related to the topic.",
        "answer": "Each answer should be at least 30 words long, providing detailed explanations, examples, and references."
      }
    ],
    "important_things_to_take_care_of": [
      "List at least 8 critical factors, each explained in at least 30 words."
    ],
    "good_methods_and_practices": [
      "Include at least 10 best practices, each explained in 40 words with benefits and real-world examples."
    ],
    "futuristic_predictions": [
      "Provide at least 8 future trends or predictions, each explained in at least 30 words with supporting reasons and technological advancements."
    ],
    "use_case_scenarios": [
      {
        "scenario": "Provide at least 2 different scenarios where this concept is applied.",
        "potential_outcome": "Each scenario should have a detailed outcome explained in at least 50 words."
      }
    ],
    "step_by_step_guidelines": [
      {
        "step": "Provide at least 8 steps in a structured manner.",
        "description": "Each step should be at least 40 words long, explaining the process, importance, and best practices."
      }
    ],
    "common_mistakes_to_avoid": [
      {
        "mistake": "Provide at least 5 common mistakes.",
        "reason": "Each mistake should have a 40 word explanation on why it happens.",
        "alternative_approach": "Provide a 20 word alternative solution for each mistake."
      }
    ],
    "critical_evaluation_metrics": [
      {
        "metric": "List at least 7 evaluation metrics.",
        "importance": "Each metric should be explained in at least 40 words, detailing why it is critical.",
        "how_to_measure": "Provide practical ways to measure it with examples in at least 40 words."
      }
    ]
  },
  "total_output_length": "Ensure the total response is at least 5 pages (1800+ words). Expand on explanations, examples, and best practices if necessary."
}}
{delimiter}

Ensure that all the data that you output is agriculturally accepted and known. If not, regenerate and stricly give the data that is correct.
    """
    return prompt

def check_hallucination_prompt(report: str) -> str:
    prompt = f"""
    ### भूमिका:
आप एक वरिष्ठ कृषि विशेषज्ञ और सुपरवाइजर हैं, जिनके पास दशकों का अनुभव है। आप खेतों, मिट्टी, उर्वरक, कीट नियंत्रण, सिंचाई और सतत कृषि (sustainable farming) के विशेषज्ञ हैं। आपका कार्य इस रिपोर्ट का मूल्यांकन करना है और यह सुनिश्चित करना है कि यह पूरी तरह से **वैज्ञानिक, व्यावहारिक, और निष्पक्ष** हो।

### आपकी जिम्मेदारियाँ:
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

### **इनपुट (रिपोर्ट डेटा)**
{report}

### **पूर्वाग्रह मूल्यांकन JSON मापदंड:**
आप नीचे दिए गए पूर्वाग्रह चेकलिस्ट के आधार पर रिपोर्ट की समीक्षा करें। आप `{aiBiasChecklist}` फ़ाइल का भी संदर्भ ले सकते हैं।

---

### **उत्तर स्वरूप (Response Format)**
आपको नीचे दिए गए दो अनुभागों के साथ JSON स्वरूप में उत्तर देना होगा:

1. `'मूल_इनपुट'`: रिपोर्ट का वही इनपुट।
2. `'पूर्वाग्रह_मूल्यांकन'`: प्रत्येक पूर्वाग्रह की जाँच के लिए `'Y'` (पूर्वाग्रह नहीं मिला) या `'N'` (पूर्वाग्रह मिला)।

**यदि कोई पूर्वाग्रह ('N') पाया जाता है, तो `'मूल_इनपुट'` नहीं दिखाना है और केवल `'पूर्वाग्रह_मूल्यांकन'` लौटाना है।**

**यदि रिपोर्ट निष्पक्ष और सटीक है:**
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
        "सेंसर_और_डेटा_विश्वसनीयता_पूर्वाग्रह": "Y",
        "निर्णय_लेने_का_पूर्वाग्रह": "Y",
        "अनिश्चितता_और_आत्मविश्वास_अंशांकन_पूर्वाग्रह": "Y"
    }}
}}
    """
    return prompt

@app.post("/generate_report", response_model=Dict[str, Any])
async def generate_report(request: ReportRequest):
    try:
        # Step 1: Generate initial report
        report_prompt = generate_report_prompt(request)
        initial_report = get_completion(report_prompt)
        print("Generated initial report")

        # Step 2: Check for hallucinations
        hallucination_prompt = check_hallucination_prompt(initial_report)
        hallucination_check = get_completion(hallucination_prompt)
        print("Completed hallucination check")

        try:
            # Parse the hallucination check response
            hallucination_result = json.loads(hallucination_check)
            
            # Return both the original report and the hallucination check
            return {
                "report": initial_report,
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

# Health check endpoint
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "files_loaded": {
            "generalized_resources": bool(generalized),
            "ai_bias_checklist": bool(aiBiasChecklist)
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)