import requests
import json
import os
from flask import Flask, request, jsonify, render_template
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)

# Get API key from environment variables
API_KEY = os.environ.get("AI_API_KEY")

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/suggest_crop', methods=['POST'])
def suggest_crop():
    # Get input data from the user
    data = request.json
    
    # Extract relevant agricultural parameters
    soil_type = data.get('soil_type', '')
    temperature = data.get('temperature', '')
    rainfall = data.get('rainfall', '')
    humidity = data.get('humidity', '')
    ph_level = data.get('ph_level', '')
    location = data.get('location', '')
    season = data.get('season', '')
    
    # Craft a prompt for the AI
    prompt = f"""
    Based on the following agricultural parameters, suggest suitable crops:
    - Soil Type: {soil_type}
    - Average Temperature: {temperature}
    - Rainfall: {rainfall}
    - Humidity: {humidity}
    - pH Level: {ph_level}
    - Location: {location}
    - Season: {season}
    
    Please provide a list of recommended crops, with explanations for why they would be suitable.
    """
    
    # The correct format for Gemini API
    try:
        response = requests.post(
            f"https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key={API_KEY}",
            headers={
                "Content-Type": "application/json",
            },
            json={
                "contents": [
                    {
                        "parts": [
                            {
                                "text": prompt
                            }
                        ]
                    }
                ],
                "generationConfig": {
                    "temperature": 0.7,
                    "topK": 40,
                    "topP": 0.95,
                    "maxOutputTokens": 1024
                }
            }
        )
        
        print("API Response status code:", response.status_code)
        
        # Process the response
        if response.status_code == 200:
            ai_response = response.json()
            # Make sure to traverse the response structure correctly
            suggestion = ai_response.get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('text', '')
            
            if not suggestion:
                print("No suggestion text found in response")
                return jsonify({"error": "No useful suggestion received from AI"}), 500
                
            return jsonify({"suggestion": suggestion})
        else:
            print("API error response:", response.text)
            return jsonify({"error": f"API error: {response.status_code} - {response.text}"}), 500
    
    except Exception as e:
        print("Exception:", str(e))
        return jsonify({"error": str(e)}), 500

# Add debug information to help troubleshoot API issues
@app.route('/api_test', methods=['GET'])
def test_api():
    if not API_KEY:
        return jsonify({"status": "error", "message": "API key not found in environment variables"})
    
    # Simple test to see if we can connect to the API
    try:
        test_response = requests.get(
            f"https://generativelanguage.googleapis.com/v1/models?key={API_KEY}"
        )
        if test_response.status_code == 200:
            return jsonify({"status": "success", "message": "API connection successful", "available_models": test_response.json()})
        else:
            return jsonify({"status": "error", "message": f"API test failed with status {test_response.status_code}", "details": test_response.text})
    except Exception as e:
        return jsonify({"status": "error", "message": f"API test exception: {str(e)}"})

if __name__ == '__main__':
    app.run(debug=True)
