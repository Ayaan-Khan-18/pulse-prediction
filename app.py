"""
Predictive Pulse — Flask API
==============================
Trained on: Framingham Heart Study (4,240 real patients)
Model:      Random Forest  |  Accuracy: 99.76%  |  F1: 99.76%

Setup:
  python -m venv venv
  venv\Scripts\activate        # Windows
  source venv/bin/activate     # Mac/Linux
  pip install -r requirements.txt
  python app.py

Then open http://localhost:5000 in your browser.
"""

from flask import Flask, request, jsonify, send_from_directory, render_template
from flask_cors import CORS
import pickle, os, json
import numpy as np
import pandas as pd

app = Flask(__name__)
CORS(app)

BASE = os.path.dirname(os.path.abspath(__file__))

with open(os.path.join(BASE, 'model.pkl'),    'rb') as f: MODEL    = pickle.load(f)
with open(os.path.join(BASE, 'scaler.pkl'),   'rb') as f: SCALER   = pickle.load(f)
with open(os.path.join(BASE, 'features.pkl'), 'rb') as f: FEATURES = pickle.load(f)
with open(os.path.join(BASE, 'meta.json'))         as f: META     = json.load(f)

STAGE_LABELS = {
    0: "Normal",
    1: "Elevated",
    2: "Stage 1 Hypertension",
    3: "Stage 2 Hypertension",
}

RECOMMENDATIONS = {
    0: "Your blood pressure is in the normal range. Keep up healthy habits — regular exercise, a balanced low-sodium diet, and stress management are your best allies.",
    1: "Your BP is elevated. Cut sodium below 2,300 mg/day, increase aerobic exercise to at least 150 min/week, reduce alcohol, and track your BP weekly at home.",
    2: "Stage 1 Hypertension confirmed. Please consult a doctor within the next month. Adopt the DASH diet, reduce sodium below 1,500 mg/day, quit smoking, and manage stress.",
    3: "Stage 2 Hypertension is serious and increases your risk of heart attack, stroke, and kidney failure. Please see a physician as soon as possible. Medication is very likely required.",
}

print(f"Model loaded — {META['dataset']}")
print(f"Accuracy: {META['accuracy']*100:.2f}%  F1: {META['f1_score']*100:.2f}%")


# ── Serve frontend ─────────────────────────────────────────────────────────────
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/script.js')
def serve_js():
    return send_from_directory(BASE, 'static/script.js')

@app.route('/style.css')
def serve_css():
    return send_from_directory(BASE, 'static/style.css')


# ── API routes ─────────────────────────────────────────────────────────────────
@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "status":   "ok",
        "model":    "Random Forest",
        "dataset":  META['dataset'],
        "accuracy": META['accuracy'],
        "f1_score": META['f1_score'],
    })


@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json(force=True)

        row = {
            "age":             float(data.get("age",            45)),
            "male":            float(data.get("sex",             1)),
            "currentSmoker":   float(data.get("smoking",         0)),
            "cigsPerDay":      float(data.get("cigsPerDay",      0)),
            "BPMeds":          float(data.get("BPMeds",          0)),
            "prevalentStroke": float(data.get("prevalentStroke", 0)),
            "prevalentHyp":    float(data.get("prevalentHyp",   0)),
            "diabetes":        float(data.get("diabetes",        0)),
            "totChol":         float(data.get("cholesterol",   200)),
            "sysBP":           float(data.get("systolic",      120)),
            "diaBP":           float(data.get("diastolic",      80)),
            "BMI":             float(data.get("bmi",            25)),
            "heartRate":       float(data.get("heartRate",      75)),
            "glucose":         float(data.get("bloodGlucose",   90)),
        }

        X         = pd.DataFrame([row])[FEATURES].astype(float)
        X_scaled  = SCALER.transform(X)
        stage     = int(MODEL.predict(X_scaled)[0])
        raw_probs = MODEL.predict_proba(X_scaled)[0]

        full_probs = [0.0, 0.0, 0.0, 0.0]
        for i, cls in enumerate(MODEL.classes_):
            full_probs[int(cls)] = round(float(raw_probs[i]), 4)

        return jsonify({
            "stage":          stage,
            "label":          STAGE_LABELS[stage],
            "confidence":     round(full_probs[stage], 4),
            "probabilities":  full_probs,
            "recommendation": RECOMMENDATIONS[stage],
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 400


if __name__ == '__main__':
    print("\nPredictive Pulse running — open http://localhost:5000 in your browser\n")
    app.run(host='0.0.0.0', port=5000, debug=False)
