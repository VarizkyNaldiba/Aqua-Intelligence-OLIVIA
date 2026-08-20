import os
import sys
import json
import numpy as np

# Suppress TensorFlow verbose log messages
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'

# Safe import joblib
try:
    import joblib  # type: ignore
except ImportError:
    joblib = None

# Safe import Keras / TensorFlow (Optional DL backend)
keras_available = False
keras = None

try:
    import keras  # type: ignore
    keras_available = True
except ImportError:
    try:
        import tensorflow as tf  # type: ignore
        keras = tf.keras
        keras_available = True
    except ImportError:
        keras = None
        keras_available = False

def load_prediction_service():
    if not keras_available or keras is None or joblib is None:
        raise ImportError("Keras/TensorFlow/Joblib framework belum terpasang di Python environment.")

    base_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(base_dir, 'model', 'model_catfishcare_bilstm.keras')
    scaler_path = os.path.join(base_dir, 'model', 'scaler_catfishcare.pkl')

    if not os.path.exists(model_path):
        model_path = os.path.join(base_dir, 'model_catfishcare_bilstm.keras')
    if not os.path.exists(scaler_path):
        scaler_path = os.path.join(base_dir, 'scaler_catfishcare.pkl')

    if not os.path.exists(model_path) or not os.path.exists(scaler_path):
        raise FileNotFoundError(f"Model or Scaler file not found. Paths: {model_path}, {scaler_path}")

    scaler = joblib.load(scaler_path)
    model = keras.models.load_model(model_path, compile=False)
    return model, scaler

def predict_24h(sensor_history=None):
    """
    Predict 24-hour horizon given sensor history for ['Temperature (C)', 'Turbidity(NTU)', 'PH']
    LOOKBACK = 48 timesteps
    HORIZON = 24 timesteps
    """
    try:
        model, scaler = load_prediction_service()
    except Exception as e:
        return {"status": "fallback", "reason": str(e), "predictions": generate_fallback_forecast()}

    # Standard default baseline if history is incomplete (48 timesteps)
    default_step = [27.5, 20.0, 7.2]
    
    if not sensor_history or not isinstance(sensor_history, list) or len(sensor_history) == 0:
        history_matrix = np.tile(default_step, (48, 1))
    else:
        matrix = []
        for item in sensor_history:
            temp = float(item.get('TEMPERATURE', item.get('suhu', 27.5)))
            turb = float(item.get('TURBIDITY', item.get('kekeruhan', 20.0)))
            ph = float(item.get('pH', item.get('ph', 7.2)))
            matrix.append([temp, turb, ph])
        
        # If fewer than 48 steps, repeat the last observation to reach lookback 48
        if len(matrix) < 48:
            padding = [matrix[-1] if len(matrix) > 0 else default_step] * (48 - len(matrix))
            matrix = padding + matrix
        elif len(matrix) > 48:
            matrix = matrix[-48:]
            
        history_matrix = np.array(matrix)

    try:
        scaled_history = scaler.transform(history_matrix)
        input_tensor = np.expand_dims(scaled_history, axis=0) # (1, 48, 3)

        preds_scaled = model.predict(input_tensor, verbose=0) # (1, 24, 3)
        preds_scaled_2d = preds_scaled.reshape(24, 3)
        preds_unscaled = scaler.inverse_transform(preds_scaled_2d) # (24, 3)

        result = []
        for idx in range(24):
            temp_val = float(np.round(preds_unscaled[idx, 0], 2))
            turb_val = float(np.round(preds_unscaled[idx, 1], 2))
            ph_val = float(np.round(preds_unscaled[idx, 2], 2))

            # Bound values within realistic physical bounds
            temp_val = max(15.0, min(40.0, temp_val))
            turb_val = max(0.0, min(500.0, turb_val))
            ph_val = max(4.0, min(10.0, ph_val))

            hour_str = f"{idx:02d}:00"
            result.append({
                "time": hour_str,
                "temperature": temp_val,
                "turbidity": turb_val,
                "ph": ph_val,
            })

        return {"status": "success", "source": "BiLSTM Neural Network (.keras)", "predictions": result}

    except Exception as err:
        return {"status": "fallback", "reason": str(err), "predictions": generate_fallback_forecast()}

def generate_fallback_forecast():
    """Fallback 24h baseline curve if prediction runner encounters environment constraints."""
    result = []
    base_temp = 27.5
    base_ph = 7.2
    base_turb = 20.0
    for idx in range(24):
        hour_str = f"{idx:02d}:00"
        temp = round(base_temp + 0.8 * np.sin(idx * np.pi / 12), 2)
        ph = round(base_ph + 0.15 * np.cos(idx * np.pi / 12), 2)
        turb = round(base_turb + 2.0 * np.sin(idx * np.pi / 6), 2)
        result.append({
            "time": hour_str,
            "temperature": temp,
            "turbidity": max(0.0, turb),
            "ph": ph
        })
    return result

if __name__ == "__main__":
    if len(sys.argv) > 1:
        try:
            input_data = json.loads(sys.argv[1])
        except Exception:
            input_data = None
    else:
        input_data = None

    output = predict_24h(input_data)
    print(json.dumps(output))
