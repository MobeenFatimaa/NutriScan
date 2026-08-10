import os
import json
import uuid
from PIL import Image
from flask import Flask, render_template, request, flash, redirect, url_for, session
from werkzeug.utils import secure_filename

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "nutriscan-secret-key-2026")

# Folder & File Configurations
UPLOAD_FOLDER = os.path.join("static", "uploads")
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "webp"}
MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB limit

app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
app.config["MAX_CONTENT_LENGTH"] = MAX_CONTENT_LENGTH

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Device configuration (GPU if available, else CPU)
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Load Class Names
CLASS_NAMES_FILE = "class_names.json"
MODEL_PATH = "food101_model.pth"

class_names = []
if os.path.exists(CLASS_NAMES_FILE):
    with open(CLASS_NAMES_FILE, "r") as f:
        class_names = json.load(f)

num_classes = len(class_names) if class_names else 101

# Initialize MobileNetV3-Large
model = models.mobilenet_v3_large(weights=None)
num_ftrs = model.classifier[3].in_features
model.classifier[3] = nn.Linear(num_ftrs, num_classes)

# Load Checkpoint
if os.path.exists(MODEL_PATH):
    checkpoint = torch.load(MODEL_PATH, map_location=device)
    
    if isinstance(checkpoint, dict) and "model_state_dict" in checkpoint:
        state_dict = checkpoint["model_state_dict"]
    elif isinstance(checkpoint, dict) and "state_dict" in checkpoint:
        state_dict = checkpoint["state_dict"]
    else:
        state_dict = checkpoint

    model.load_state_dict(state_dict)
    model.to(device)
    model.eval()

# Preprocessing Pipeline
img_transforms = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])


def allowed_file(filename):
    """Verify supported image extensions."""
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def get_nutritional_database():
    """Nutritional dictionary lookup."""
    return {
        "pizza": {
            "portion": "1 Slice (approx. 100g)",
            "calories": 285,
            "rating": "Moderate",
            "macros": {"protein_g": 12, "carbs_g": 36, "fats_g": 10, "fiber_g": 2.5},
            "micros": ["Calcium", "Sodium", "Vitamin A", "Iron"],
            "summary": "Moderate in protein and carbohydrates. Consume in moderation due to sodium and fat levels."
        },
        "sushi": {
            "portion": "6 Rolls (approx. 200g)",
            "calories": 300,
            "rating": "High",
            "macros": {"protein_g": 15, "carbs_g": 42, "fats_g": 5, "fiber_g": 2},
            "micros": ["Omega-3", "Iodine", "Vitamin B12", "Selenium"],
            "summary": "Rich in healthy lean proteins and omega-3 fatty acids with a balanced macro ratio."
        },
        "hamburger": {
            "portion": "1 Burger (approx. 220g)",
            "calories": 540,
            "rating": "Moderate",
            "macros": {"protein_g": 28, "carbs_g": 45, "fats_g": 26, "fiber_g": 3},
            "micros": ["Iron", "Zinc", "Vitamin B6", "Sodium"],
            "summary": "High protein content, but elevated in saturated fats. Pair with whole foods for balance."
        }
    }


def predict_food(image_path):
    """Inference execution using MobileNetV3-Large model."""
    image = Image.open(image_path).convert("RGB")
    tensor_img = img_transforms(image).unsqueeze(0).to(device)

    with torch.no_grad():
        outputs = model(tensor_img)
        probabilities = torch.nn.functional.softmax(outputs, dim=1)
        confidence, predicted_idx = torch.max(probabilities, 1)

    predicted_class = class_names[predicted_idx.item()] if class_names else "food_item"
    predicted_label = predicted_class.replace("_", " ").title()

    db = get_nutritional_database()
    nutritional_info = db.get(predicted_class.lower(), {
        "portion": "1 Standard Portion (approx. 250g)",
        "calories": 350,
        "rating": "Balanced",
        "macros": {"protein_g": 20, "carbs_g": 30, "fats_g": 12, "fiber_g": 4},
        "micros": ["Vitamin C", "Calcium", "Iron", "Potassium"],
        "summary": f"Estimated nutritional metrics derived for {predicted_label}."
    })

    return {
        "is_food": True,
        "dish_name": predicted_label,
        "confidence": round(confidence.item() * 100, 2),
        "estimated_portion": nutritional_info["portion"],
        "calories": nutritional_info["calories"],
        "health_rating": nutritional_info["rating"],
        "macros": nutritional_info["macros"],
        "micronutrients": nutritional_info["micros"],
        "health_summary": nutritional_info["summary"]
    }


@app.route("/", methods=["GET", "POST"])
def index():
    if request.method == "POST":
        if "food_image" not in request.files:
            flash("No file payload submitted.", "error")
            return redirect(url_for("index"))

        file = request.files["food_image"]

        if file.filename == "":
            flash("Please choose an image file to upload.", "warning")
            return redirect(url_for("index"))

        if file and allowed_file(file.filename):
            unique_filename = f"{uuid.uuid4().hex}_{secure_filename(file.filename)}"
            filepath = os.path.join(app.config["UPLOAD_FOLDER"], unique_filename)
            
            file.save(filepath)
            uploaded_image_url = url_for("static", filename=f"uploads/{unique_filename}")

            try:
                data = predict_food(filepath)
                # Attach image path directly to data dict for Jinja2 rendering
                data["image_path"] = uploaded_image_url

                # Save current analysis result in session for display after redirect
                session["latest_analysis"] = data

                # Track analysis in user session history
                history_item = {
                    "dish_name": data.get("dish_name"),
                    "calories": data.get("calories"),
                    "image_path": uploaded_image_url
                }
                history = session.get("history", [])
                history.insert(0, history_item)
                session["history"] = history[:5]  # Keep 5 most recent records

                # Redirect directly to the results anchor section
                return redirect(url_for("index") + "#results-section")

            except Exception as e:
                flash(f"Model Inference Error: {str(e)}", "error")
                return redirect(url_for("index"))
        else:
            flash("Invalid file extension. Please submit PNG, JPG, JPEG, or WEBP.", "error")
            return redirect(url_for("index"))

    # GET Request Handling
    data = session.pop("latest_analysis", None)
    return render_template("index.html", data=data, history=session.get("history", []))


@app.route("/clear-history")
def clear_history():
    """Clear analysis session history."""
    session.pop("history", None)
    session.pop("latest_analysis", None)
    flash("Session history cleared.", "info")
    return redirect(url_for("index"))


@app.errorhandler(413)
def file_too_large(error):
    flash("Uploaded file exceeds maximum limit of 16MB.", "error")
    return redirect(url_for("index")), 413


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
