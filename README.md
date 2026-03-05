# 💓 Predictive Pulse
### Blood Pressure Analysis & Hypertension Prediction System
> Machine Learning · Flask API · Framingham Heart Study

![Python](https://img.shields.io/badge/Python-3.10+-blue?style=flat-square&logo=python)
![Flask](https://img.shields.io/badge/Flask-3.x-black?style=flat-square&logo=flask)
![scikit-learn](https://img.shields.io/badge/scikit--learn-1.8-orange?style=flat-square&logo=scikit-learn)
![PyTorch](https://img.shields.io/badge/PyTorch-2.x-red?style=flat-square&logo=pytorch)
![Accuracy](https://img.shields.io/badge/Accuracy-99.76%25-brightgreen?style=flat-square)

---

## 📋 Overview

Predictive Pulse is an end-to-end machine learning web application that predicts hypertension stage from patient clinical data. Trained on the real **Framingham Heart Study dataset (4,240 patients)**, it classifies blood pressure into four stages:

| Stage | Systolic | Diastolic |
|---|---|---|
| ✅ Normal | < 120 mmHg | AND < 80 mmHg |
| ⚠️ Elevated | 120–129 mmHg | AND < 80 mmHg |
| 🔴 Stage 1 Hypertension | 130–139 mmHg | OR 80–89 mmHg |
| 🚨 Stage 2 Hypertension | ≥ 140 mmHg | OR ≥ 90 mmHg |

---

## 🔄 Project Flow

```
Patient Input (14 clinical parameters)
        ↓
features.pkl  →  arrange columns in correct order
        ↓
scaler.pkl    →  normalize values (StandardScaler)
        ↓
model.pkl     →  Random Forest predicts BP stage
        ↓
Result: Stage + Confidence + Probabilities + Recommendation
```

---

## 📁 Project Structure

```
pulse-prediction/
├── static/
│   ├── style.css               # Frontend styles
│   └── script.js               # Calls API, renders results
├── templates/
│   └── index.html              # Predictive Pulse UI
├── app.py                      # Flask backend + /predict API
├── train_compare.py            # Trains & compares 6 sklearn models
├── train_pytorch.py            # PyTorch Neural Network training
├── eda.py                      # Exploratory Data Analysis + plots
├── predictive_pulse.ipynb      # Google Colab end-to-end notebook
├── framingham.csv              # Framingham Heart Study dataset
├── requirements.txt            # Python dependencies
├── model.pkl                   # Trained Random Forest model
├── scaler.pkl                  # Fitted StandardScaler
├── features.pkl                # Ordered feature names
└── meta.json                   # Model metadata
```

---

## ⚙️ Setup & Installation

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/pulse-prediction.git
cd pulse-prediction
```

### 2. Create virtual environment
```bash
python -m venv venv
source venv/bin/activate        # Linux / Mac
```

### 3. Install dependencies
```bash
pip install -r requirements.txt
```

### 4. Train the model
```bash
python train_compare.py
```
This trains 6 algorithms on `framingham.csv`, selects the best, and saves `model.pkl`, `scaler.pkl`, `features.pkl`, and `meta.json`.

### 5. Run the app
```bash
python app.py
```
Open **http://localhost:5000** in your browser.

---

## 🔌 API Reference

### `GET /health`
Returns model status and accuracy metrics.

### `POST /predict`
Accepts patient clinical parameters and returns the predicted BP stage.

**Request body:**
```json
{
    "age": 55,
    "sex": 1,
    "systolic": 145,
    "diastolic": 92,
    "heartRate": 80,
    "cholesterol": 240,
    "bloodGlucose": 100,
    "bmi": 28.5,
    "smoking": 1,
    "cigsPerDay": 10,
    "BPMeds": 0,
    "prevalentStroke": 0,
    "prevalentHyp": 1,
    "diabetes": 0
}
```

**Response:**
```json
{
    "stage": 3,
    "label": "Stage 2 Hypertension",
    "confidence": 0.9712,
    "probabilities": [0.00, 0.01, 0.02, 0.97],
    "recommendation": "Stage 2 Hypertension is serious. See a physician this week."
}
```

---

## 📊 Model Performance

| Model | Accuracy | F1 Score | ROC-AUC |
|---|---|---|---|
| Logistic Regression | 88.68% | 88.52% | 97.51% |
| Decision Tree | 99.76% | 99.76% | 99.88% |
| **Random Forest ⭐** | **99.76%** | **99.76%** | **100.0%** |
| Gradient Boosting | 99.76% | 99.76% | 100.0% |
| SVM | 88.33% | 88.16% | 97.93% |
| KNN | 78.18% | 77.43% | 92.41% |
| PyTorch Neural Net | 97–99% | 97–99% | N/A |

> ⭐ Random Forest selected as the deployment model based on F1 Score and ROC-AUC.

---

## 🔬 Training Scripts

### `eda.py` — Exploratory Data Analysis
Generates 4 plots saved to `plots/`:
- Feature distribution histograms by BP stage
- Univariate boxplots (age, BMI, cholesterol, glucose, heart rate)
- Correlation heatmap
- Bivariate scatter plots (Systolic vs Diastolic, Age vs Systolic)

```bash
python eda.py
```

### `train_compare.py` — Multi-Model Comparison
- Trains 6 sklearn algorithms with 5-fold cross-validation
- Generates model comparison bar chart and confusion matrix
- Saves best model artifacts

```bash
python train_compare.py
```

### `train_pytorch.py` — Neural Network
- Architecture: `Input(14) → 128 → 64 → 32 → 4`
- BatchNorm + Dropout + Adam optimizer
- Early stopping with patience=20

```bash
pip install torch
python train_pytorch.py
```

### `predictive_pulse.ipynb` — Google Colab Notebook
Full end-to-end pipeline in a single notebook:
1. Mount Google Drive → load `framingham.csv`
2. EDA with 4 inline plots
3. Train and compare all 6 sklearn models
4. Train PyTorch Neural Network with loss/accuracy curves
5. Save model artifacts back to Google Drive

---

## 📂 Dataset

**Framingham Heart Study** — 4,240 patients, 14 clinical features

| Feature | Description |
|---|---|
| `age` | Patient age (years) |
| `male` | Sex (1=male, 0=female) |
| `currentSmoker` | Current smoker flag |
| `cigsPerDay` | Cigarettes smoked per day |
| `BPMeds` | On blood pressure medication |
| `prevalentStroke` | History of stroke |
| `prevalentHyp` | History of hypertension |
| `diabetes` | Diabetic flag |
| `totChol` | Total cholesterol (mg/dL) |
| `sysBP` | Systolic blood pressure (mmHg) |
| `diaBP` | Diastolic blood pressure (mmHg) |
| `BMI` | Body Mass Index (kg/m²) |
| `heartRate` | Heart rate (bpm) |
| `glucose` | Blood glucose (mg/dL) |

Dataset source: [Kaggle — Framingham Heart Study](https://www.kaggle.com/datasets/amanajmera1/framingham-heart-study-dataset)

---

## 📦 Requirements

```
flask
flask-cors
scikit-learn
pandas
numpy
matplotlib
seaborn
torch
```

Install all with:
```bash
pip install -r requirements.txt
```

---

## ⚕️ Medical Disclaimer

> Predictive Pulse uses machine learning for **educational and screening purposes only**. It does not constitute a medical diagnosis and does not replace professional medical advice. Always consult a qualified healthcare provider for any health concerns.

---

*Predictive Pulse · Framingham Heart Study · Machine Learning Hypertension Prediction*
