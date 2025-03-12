from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
import re  # Import regex module for text cleaning

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}) 


# Configure Gemini API Key
GEMINI_API_KEY = "AIzaSyD69I9Aq9JpGbDdJTWv-ghHL5jDtettFN8"  # Replace with your API key
genai.configure(api_key=GEMINI_API_KEY)

# Root route
@app.route('/')
def home():
    return "Welcome to the Crop Recommendation API! Use /api/crop-suggestions?location=YourCity"

# Handle favicon request (optional)
@app.route('/favicon.ico')
def favicon():
    return '', 204  # Return empty response

# Function to clean AI response (remove asterisks & redundant text)
def clean_text(text):
    """Removes markdown bullet points and redundant phrases from AI output."""
    cleaned_text = re.sub(r"^\*+\s*", "", text, flags=re.MULTILINE)  # Remove leading *
    cleaned_text = re.sub(r"\*\*", "", cleaned_text)  # Remove bold ** marks
    cleaned_text = re.sub(r"\nRecommended for this region\.", "", cleaned_text)  # Remove redundant phrases
    return cleaned_text.strip()

# Function to get crop suggestions from Gemini AI
def get_crop_suggestions(location):
    prompt = f"Suggest the best crops to grow in {location} based on climate, soil type, and geography."
    try:
        model = genai.GenerativeModel("gemini-1.5-flash")  # Using free-tier model
        response = model.generate_content(prompt)

        if response.text:
            cleaned_response = clean_text(response.text)  # Clean the AI-generated text
            crops = cleaned_response.split("\n")  # Convert to list
        else:
            crops = ["No suggestions available."]
        
        return crops
    except Exception as e:
        return [f"Error: {str(e)}"]

# API route for crop suggestions
@app.route('/api/crop-suggestions', methods=['GET'])
def crop_suggestions():
    location = request.args.get('location', '').strip()
    if not location:
        return jsonify({"error": "Location is required"}), 400

    crops = get_crop_suggestions(location)
    return jsonify({"location": location, "crops": [{"name": crop, "description": "Recommended for this region."} for crop in crops]})

# Run the Flask app
if __name__ == '__main__':
    app.run(debug=True, port=5001)
