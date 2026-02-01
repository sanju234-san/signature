"""
FastAPI Server for Signature Verification
Provides REST API endpoints for signature authentication
"""

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import numpy as np
import cv2
from PIL import Image
import io
import os
from datetime import datetime

# Import our modules
import config
import model

# Initialize FastAPI app
app = FastAPI(
    title="Signature Verification API",
    description="AI-powered signature authentication system",
    version="1.0.0"
)

# Configure CORS (for frontend access)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variable to store loaded model
loaded_model = None


def load_trained_model():
    """
    Load the trained model at startup
    """
    global loaded_model
    
    try:
        print("\n" + "="*60)
        print("🔄 LOADING TRAINED MODEL")
        print("="*60)
        
        # Try to load the latest model
        loaded_model = model.load_model('signature_model_latest', format='keras')
        
        if loaded_model is None:
            print("⚠️  Warning: No trained model found!")
            print("   Please train a model first using train.py")
        else:
            print("✅ Model loaded successfully!")
            print("="*60)
            
    except Exception as e:
        print(f"❌ Error loading model: {str(e)}")
        loaded_model = None


def preprocess_signature(image_bytes):
    """
    Preprocess uploaded signature image for prediction
    
    Parameters:
    -----------
    image_bytes : bytes
        Raw image bytes from upload
    
    Returns:
    --------
    processed_image : numpy array
        Preprocessed image ready for model
    """
    
    # Convert bytes to numpy array
    nparr = np.frombuffer(image_bytes, np.uint8)
    
    # Decode image
    img = cv2.imdecode(nparr, cv2.IMREAD_GRAYSCALE)
    
    if img is None:
        raise ValueError("Could not decode image")
    
    # Resize to model input size
    img = cv2.resize(img, config.IMAGE_SIZE)
    
    # Normalize pixel values (0-255 → 0-1)
    img = img / 255.0
    
    # Reshape for model input (add batch and channel dimensions)
    img = img.reshape(1, config.INPUT_SHAPE[0], config.INPUT_SHAPE[1], config.INPUT_SHAPE[2])
    
    return img


@app.on_event("startup")
async def startup_event():
    """
    Load model when server starts
    """
    load_trained_model()


@app.get("/")
async def root():
    """
    Root endpoint - API information
    """
    return {
        "message": "Signature Verification API",
        "version": "1.0.0",
        "status": "active",
        "model_loaded": loaded_model is not None,
        "endpoints": {
            "health": "/health",
            "predict": "/predict",
            "verify": "/verify",
            "model_info": "/model/info"
        }
    }


@app.get("/health")
async def health_check():
    """
    Health check endpoint
    """
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "model_loaded": loaded_model is not None
    }


@app.post("/predict")
async def predict_signature(file: UploadFile = File(...)):
    """
    Predict if a signature is genuine or forged
    
    Parameters:
    -----------
    file : UploadFile
        Image file of signature
    
    Returns:
    --------
    JSON response with prediction and confidence
    """
    
    # Check if model is loaded
    if loaded_model is None:
        raise HTTPException(
            status_code=503,
            detail="Model not loaded. Please train a model first."
        )
    
    # Validate file type
    if not file.content_type.startswith('image/'):
        raise HTTPException(
            status_code=400,
            detail="File must be an image (PNG, JPG, JPEG, etc.)"
        )
    
    try:
        # Read image file
        image_bytes = await file.read()
        
        # Preprocess image
        processed_image = preprocess_signature(image_bytes)
        
        # Make prediction
        prediction_prob = loaded_model.predict(processed_image, verbose=0)[0][0]
        
        # Convert to percentage
        confidence = float(prediction_prob * 100)
        
        # Determine class
        is_genuine = prediction_prob >= config.CONFIDENCE_THRESHOLD
        predicted_class = "GENUINE" if is_genuine else "FORGED"
        
        # Prepare response
        response = {
            "prediction": predicted_class,
            "confidence": round(confidence, 2),
            "probability": round(float(prediction_prob), 4),
            "threshold": config.CONFIDENCE_THRESHOLD,
            "details": {
                "genuine_probability": round(float(prediction_prob), 4),
                "forged_probability": round(float(1 - prediction_prob), 4)
            },
            "timestamp": datetime.now().isoformat()
        }
        
        return JSONResponse(content=response)
        
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Prediction error: {str(e)}"
        )


@app.post("/verify")
async def verify_signature(
    reference: UploadFile = File(..., description="Reference signature (genuine)"),
    test: UploadFile = File(..., description="Test signature (to verify)")
):
    """
    Compare two signatures and verify if they match
    
    Parameters:
    -----------
    reference : UploadFile
        Known genuine signature
    test : UploadFile
        Signature to verify against reference
    
    Returns:
    --------
    JSON response with verification result
    """
    
    if loaded_model is None:
        raise HTTPException(
            status_code=503,
            detail="Model not loaded. Please train a model first."
        )
    
    try:
        # Read both images
        ref_bytes = await reference.read()
        test_bytes = await test.read()
        
        # Preprocess both
        ref_processed = preprocess_signature(ref_bytes)
        test_processed = preprocess_signature(test_bytes)
        
        # Get predictions for both
        ref_pred = loaded_model.predict(ref_processed, verbose=0)[0][0]
        test_pred = loaded_model.predict(test_processed, verbose=0)[0][0]
        
        # Check if both are genuine
        ref_is_genuine = ref_pred >= config.CONFIDENCE_THRESHOLD
        test_is_genuine = test_pred >= config.CONFIDENCE_THRESHOLD
        
        # Calculate similarity (simple approach)
        similarity = 1 - abs(ref_pred - test_pred)
        
        # Verification logic
        match = ref_is_genuine and test_is_genuine and similarity > 0.85
        
        response = {
            "match": match,
            "similarity_score": round(float(similarity * 100), 2),
            "reference": {
                "prediction": "GENUINE" if ref_is_genuine else "FORGED",
                "confidence": round(float(ref_pred * 100), 2)
            },
            "test": {
                "prediction": "GENUINE" if test_is_genuine else "FORGED",
                "confidence": round(float(test_pred * 100), 2)
            },
            "verdict": "VERIFIED" if match else "REJECTED",
            "timestamp": datetime.now().isoformat()
        }
        
        return JSONResponse(content=response)
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Verification error: {str(e)}"
        )


@app.get("/model/info")
async def get_model_info():
    """
    Get information about the loaded model
    """
    
    if loaded_model is None:
        return {
            "status": "no_model",
            "message": "No model is currently loaded"
        }
    
    try:
        # Get model summary
        total_params = loaded_model.count_params()
        
        # Get layer info
        layers_info = []
        for layer in loaded_model.layers:
            layers_info.append({
                "name": layer.name,
                "type": layer.__class__.__name__,
                "output_shape": str(layer.output_shape)
            })
        
        return {
            "status": "loaded",
            "architecture": {
                "input_shape": config.INPUT_SHAPE,
                "total_parameters": int(total_params),
                "layers": layers_info
            },
            "configuration": {
                "image_size": config.IMAGE_SIZE,
                "confidence_threshold": config.CONFIDENCE_THRESHOLD
            }
        }
        
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }


@app.post("/model/reload")
async def reload_model():
    """
    Reload the model (useful after retraining)
    """
    try:
        load_trained_model()
        
        if loaded_model is None:
            return {
                "status": "failed",
                "message": "Could not load model"
            }
        
        return {
            "status": "success",
            "message": "Model reloaded successfully",
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Reload error: {str(e)}"
        )


# Run server
if __name__ == "__main__":
    print("\n" + "="*60)
    print("🚀 STARTING SIGNATURE VERIFICATION API SERVER")
    print("="*60)
    print(f"\n📍 Server will be available at:")
    print(f"   Local:   http://localhost:8000")
    print(f"   Network: http://0.0.0.0:8000")
    print(f"\n📖 API Documentation:")
    print(f"   Swagger UI: http://localhost:8000/docs")
    print(f"   ReDoc:      http://localhost:8000/redoc")
    print("\n" + "="*60 + "\n")
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info"
    )