from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import uuid
from werkzeug.utils import secure_filename
import numpy as np
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing import image
from PIL import Image
import io

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Load the trained model
model = load_model('my_model.h5')

# Define the class names
class_names = [
    'Melanocytic nevi',
    'Melanoma',
    'Benign keratosis-like lesions',
    'Basal cell carcinoma',
    'Actinic keratoses',
    'Vascular lesions',
    'Dermatofibroma'
]

# Define descriptions for each class
class_descriptions = {
    'Melanocytic nevi': 'Common moles, usually harmless growths on the skin.',
    'Melanoma': 'A serious form of skin cancer that develops in melanocytes.',
    'Benign keratosis-like lesions': 'Non-cancerous skin growths that appear as waxy brown, black or tan growths.',
    'Basal cell carcinoma': 'The most common type of skin cancer, usually developing on sun-exposed areas.',
    'Actinic keratoses': 'Rough, scaly patches on the skin caused by years of sun exposure.',
    'Vascular lesions': 'Abnormalities of blood vessels visible on the skin surface.',
    'Dermatofibroma': 'Common benign skin growths that often appear as small, firm bumps on the skin.'
}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        unique_filename = f"{uuid.uuid4()}_{filename}"
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
        file.save(file_path)
        return jsonify({'message': 'File uploaded successfully', 'filename': unique_filename}), 200
    return jsonify({'error': 'File type not allowed'}), 400

@app.route('/analyze', methods=['POST'])
def analyze_image():
    data = request.json
    filename = data.get('filename')
    if not filename:
        return jsonify({'error': 'No filename provided'}), 400

    file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    
    try:
        # Open the image file
        with Image.open(file_path) as img:
            # Resize the image to 75x100 pixels
            img = img.resize((75, 100))
            
            # Convert the image to a numpy array
            img_array = image.img_to_array(img)
            img_array = np.expand_dims(img_array, axis=0)
            img_array = img_array / 255.0  # Normalize the image

        # Make prediction
        predictions = model.predict(img_array)
        
        # Get the index of the highest probability
        predicted_class_index = np.argmax(predictions[0])
        
        # Get the class name and confidence score
        predicted_class = class_names[predicted_class_index]
        confidence_score = float(predictions[0][predicted_class_index])
        
        # Get the description for the predicted class
        description = class_descriptions.get(predicted_class, "No description available.")

        result = {
            'classification': predicted_class,
            'confidence': confidence_score,
            'description': description
        }

        return jsonify(result), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    app.run(debug=True)