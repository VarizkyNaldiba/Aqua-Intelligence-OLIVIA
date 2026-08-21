import os
import joblib
import numpy as np
from fastapi import FastAPI, HTTPException
from tensorflow.keras.models import load_model
from pydantic import BaseModel
from datetime import datetime, timedelta

app = FastAPI(title="CatfishCare AI Microservice")

# Define paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, 'model_catfishcare_bilstm.keras')
SCALER_PATH = os.path.join(BASE_DIR, 'scaler_catfishcare.pkl')

# Load Model and Scaler
try:
    model = load_model(MODEL_PATH)
    scaler = joblib.load(SCALER_PATH)
    print("Model and Scaler loaded successfully.")
except Exception as e:
    print(f"Error loading model/scaler: {e}")
    model = None
    scaler = None

FEATURES = ['Temperature (C)', 'Turbidity(NTU)', 'PH']
LOOKBACK = 48
HORIZON = 24

@app.get("/api/predictions/{kolam_id}")
def get_predictions(kolam_id: int, temp: float = 27.5, turbidity: float = 18.0, ph: float = 7.2):
    if model is None or scaler is None:
        raise HTTPException(status_code=500, detail="AI Model is not loaded properly.")
    
    # 1. Simulate 48-hour history based on current values
    # In a real scenario, this would be fetched from a time-series DB
    history = []
    for i in range(LOOKBACK):
        # Adding slight noise to simulate natural fluctuation
        t = temp + np.random.normal(0, 0.5)
        tb = turbidity + np.random.normal(0, 1.0)
        p = ph + np.random.normal(0, 0.1)
        history.append([t, tb, p])
        
    history = np.array(history)
    
    # 2. Scale the history data
    scaled_history = scaler.transform(history)
    
    # Reshape for LSTM: (batch_size, lookback, num_features)
    X_input = scaled_history.reshape(1, LOOKBACK, len(FEATURES))
    
    # 3. Predict the next 24 hours
    predicted_scaled = model.predict(X_input) # Output shape: (1, 24, 3)
    predicted_scaled = predicted_scaled[0] # (24, 3)
    
    # 4. Inverse transform
    predicted_real = scaler.inverse_transform(predicted_scaled)
    
    # 5. Format output
    forecast = []
    start_time = datetime.now()
    # Align to next hour
    start_time = start_time.replace(minute=0, second=0, microsecond=0) + timedelta(hours=1)
    
    for i in range(HORIZON):
        pred_time = (start_time + timedelta(hours=i)).strftime('%H:%00')
        t_val = round(float(predicted_real[i][0]), 2)
        tb_val = round(float(predicted_real[i][1]), 2)
        ph_val = round(float(predicted_real[i][2]), 2)
        
        # Simulate TDS and SFR based on base correlations if needed, or use static
        tds_val = round(400 + (t_val - 25) * 10, 2)
        sfr_val = round(max(0.01, 0.05 + (7.0 - ph_val) * 0.02), 3)

        forecast.append({
            'time': pred_time,
            'temperature': t_val,
            'turbidity': tb_val,
            'pH': ph_val,
            'tds': tds_val,
            'sfr': sfr_val
        })
        
    return {
        'kolam_id': kolam_id,
        'model': 'BiLSTM (Bidirectional Long Short-Term Memory) - Live Prediction',
        'horizon': '24 Jam ke Depan',
        'forecast': forecast
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
