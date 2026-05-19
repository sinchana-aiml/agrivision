# 🌾 AgriVision – AI-Based Crop Damage Detection & Insurance Claim System (PMFBY Portal)

AgriVision is an enterprise-grade AI-powered web portal designed to automate crop damage assessment using Deep Learning (CNN) and assist farmers in secure insurance claims processing under the **Pradhan Mantri Fasal Bima Yojana (PMFBY)** scheme.

The portal provides an end-to-end digital workflow: farmers upload crop leaf photographs, the CNN model classifies crop health and estimates damage percentage, the browser secures a GPS lock for verification, and administrative officers audit and approve/reject claims via a real-time analytics dashboard.

---

## 🚀 Key Features

### 👨‍🌾 Farmer Upload Portal
* **Species Selection:** Select target cultivated crop species (Tomato, Pepper, Wheat).
* **AI Image Assessment:** Upload high-resolution leaf photographs for instant health analysis.
* **Damage Percentage Estimation:** Predict precise damage margins based on model sigmoidal confidence.
* **Cryptographic GIS Verification:** Capture secure geographical coordinate stamps via HTML5 Geolocation API, preventing fraudulent out-of-boundary submissions.

### 🧑‍💼 Officer Verification Dashboard
* **Dynamic KPI Stats:** Real-time summary cards detailing Total Claims, Pending Audits, Approved Payouts, and Average Damage Ratio across all claims.
* **Granular Audit Logs:** Detailed data grid listing unique claim records, crop classification badges, coordinate values, audit statuses, and calculated payout funds.
* **One-Click Action Workflows:** Administrative approval and rejection buttons that update state changes directly in the backend.
* **PMFBY Compliant Payouts:** Auto-computes payout funds based on PMFBY guidelines:
  * 🔴 **Severe Damage (≥80%):** ₹50,000 max compensation
  * 🟡 **High Damage (50% - 79%):** ₹30,000 compensation
  * 🔵 **Moderate Damage (30% - 49%):** ₹15,000 compensation
  * 🟢 **Negligible Damage (<30%):** Ineligible for compensation (deductible threshold)

---

## 📁 Modular Folder Structure

The project has been restructured into a professional, production-ready, modular architecture:

```text
AgriVision/
│
├── backend/                       # Flask Web Backend API
│   ├── app.py                     # Entry point (initializes blueprints, serves frontend)
│   │
│   ├── routes/                    # API Route Handlers (Flask Blueprints)
│   │   ├── analyze.py             # Image analysis (/analyze)
│   │   ├── dashboard.py           # Dashboard stats & records (/dashboard)
│   │   └── claims.py              # Geotagging & officer actions (/add_location, /sanction)
│   │
│   ├── models/                    # AI Inference Model & Manager
│   │   ├── model_loader.py        # Lazy-loading singleton model manager
│   │   └── crop_damage_model.h5   # Trained CNN weights (Binary classification)
│   │
│   ├── utils/                     # Reusable Backend Helper Utilities
│   │   ├── image_processing.py    # Reads bytes, resizes (128x128), normalizes crop photos
│   │   ├── damage_calc.py         # PMFBY insurance payout calculations
│   │   └── location_utils.py      # GPS validation & string formatting
│   │
│   └── database/                  # Storage Layer Configurations
│       └── firebase_config.py     # Database wrapper (Mock Local + Firebase Firestore Switch)
│
├── frontend/                      # Static Web Interface Assets (Served by Flask)
│   ├── index.html                 # UI markup layout (Fully accessible, premium aesthetic)
│   │
│   ├── css/
│   │   └── style.css              # Custom styling (Glassmorphism layout, status badges, animations)
│   │
│   ├── js/                        # Modular Frontend Interactivity
│   │   ├── upload.js              # Farmer file input, drag-and-drop, API submit, GPS trigger
│   │   ├── dashboard.js           # Officer statistics cards & decision buttons
│   │   └── location.js            # HTML5 location acquisition service
│   │
│   └── assets/                    # Media assets
│       └── images/
│
├── ai_model/                      # Machine Learning / AI Model Development
│   ├── train_cnn.py               # Model architecture constructor & training script
│   ├── test_model.py              # Local testing script for inference verification
│   ├── dataset/                   # PlantVillage training dataset directory
│   │   ├── healthy/               # Folders with healthy crop images
│   │   └── damaged/               # Folders with damaged crop images
│   └── graphs/                    # Matplotlib exported training accuracy curves
│
├── reports/                       # Claims PDF/CSV Export folder
│   └── generated_reports/
│
├── requirements.txt               # Main python packages for development and production
├── README.md                      # Comprehensive developer guide
└── .gitignore                     # Git tracking exclusions (caches, credentials, generated PDFs)
```

---

## 🧠 Technology Stack

| Layer | Technologies Used |
|---|---|
| **Core Web UI** | HTML5 (Semantic Structure), CSS3 (Modern Glassmorphism & Animations), JavaScript (ES6+ Promises/Fetch API) |
| **Server Backend** | Python 3, Flask, Flask-CORS (Cross-Origin requests), Gunicorn (Production HTTP Server) |
| **Artificial Intelligence** | TensorFlow 2, Keras, NumPy, Pillow, Matplotlib (Graphs) |
| **GIS Mapping** | HTML5 Geolocation API (Secured coordinates capture) |
| **Cloud Storage** | Google Firebase Firestore Ready (Integration-ready interface wrapper) |

---

## 🛠️ Installation & Local Setup

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/sinchana-aiml/AgriVision-Crop-Damage-Detection.git
cd AgriVision-Crop-Damage-Detection
```

### 2️⃣ Install Required Dependencies
Initialize a virtual environment and run pip installer:
```bash
# Optional but highly recommended:
python -m venv venv
venv\Scripts\activate      # On Windows
source venv/bin/activate   # On macOS/Linux

pip install -r requirements.txt
```

### 3️⃣ Run the Flask Development Server
Launch the application:
```bash
python backend/app.py
```
The server will bind to `http://127.0.0.1:5000` and serve both the web frontend UI and the REST API.

### 4️⃣ Verification & Local Testing
Open `http://localhost:5000` in your web browser. Try dragging a crop image into the drop zone, select the crop type, and click **Analyze Crop Health** to trigger the AI inference pipeline and automatic GPS timestamp capture.

---

## 🧠 Model Training & Testing (AI Developers)

All ML code lives under `/ai_model`. The network utilizes a Sequential Conv2D architecture with relu activation, max pooling, flattening, and a dense sigmoid output.

### How to Train the Model
1. Populate your image folders under `ai_model/dataset/healthy/` and `ai_model/dataset/damaged/`.
2. Run the training script:
   ```bash
   python ai_model/train_cnn.py
   ```
   * The script automatically splits images 80/20 for training/validation, compiles the optimizer, executes training epochs, outputs accuracy curves to `ai_model/graphs/training_accuracy.png`, and automatically copies the newly compiled `crop_damage_model.h5` straight to `backend/models/`.

### How to Run Local CLI Inference Tests
To verify inference using a CLI test:
```bash
python ai_model/test_model.py
```
* By default, it will perform inference on the test image `ai_model/test_leaf.jpg` using the newly compiled weights and print outputs in a clean visual layout.

---

## ☁️ Future Cloud Deployment & Firebase Integration

The project has been prepared for production cloud deployment (e.g., Google Cloud Run, Heroku) and GitHub collaboration:

### 1. Enabling Firebase Firestore DB
The backend has been configured with a unified database manager under `backend/database/firebase_config.py`.
To switch from in-memory mock storage to permanent Google Firebase:
1. Log into the Firebase Console and create a new Firestore Project.
2. Generate a new private key JSON under **Project Settings > Service Accounts**.
3. Save the JSON key inside `backend/database/` as `firebase_credentials.json` (Note: This is automatically ignored by Git).
4. Uncomment the Firebase initialization code block in `backend/database/firebase_config.py` and flip `USE_FIREBASE = True` to enable cloud persistence!

### 2. Cloud Server Deployment
* A `.gitignore` is provided to keep credentials out of version control.
* `requirements.txt` contains `gunicorn` to easily serve the application on Cloud Run or Heroku using:
  ```bash
  gunicorn -b 0.0.0.0:$PORT "backend.app:create_app()"
  ```

---

## 👩‍💻 Developed By

* **Sinchana**
* AIML Project – AgriVision

---

## ⭐ Acknowledgements

* **PlantVillage Dataset** for high-quality leaf disease training assets.
* **TensorFlow & Flask** communities.
* **Government of India – PMFBY Scheme** for providing real-world operational guidelines.
