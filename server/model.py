"""
Neural Network Model for Signature Verification
Defines the ANN architecture with save/load functionality
"""

import os
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers, models
import config

def build_model():
    """
    Build the ANN architecture for signature verification
    
    Architecture:
    Input (16,384) → Dense(256) → Dense(128) → Dense(64) → Output(1)
    
    Returns:
    --------
    model : keras.Model
        Compiled neural network ready for training
    """
    
    print("\n" + "="*60)
    print("🏗️  BUILDING MODEL ARCHITECTURE")
    print("="*60)
    
    # Initialize Sequential model (layers stacked one after another)
    model = models.Sequential(name='Signature_Verification_ANN')
    
    # INPUT LAYER (automatically handled by first Dense layer)
    # Input shape: (128, 128, 1) = 16,384 pixels
    
    # FLATTEN LAYER - Convert 2D image to 1D vector
    # (128, 128, 1) → (16,384)
    print("\n1️⃣ Adding Flatten Layer")
    print(f"   Input:  (128, 128, 1) → Output: (16,384)")
    model.add(layers.Flatten(input_shape=config.INPUT_SHAPE, name='flatten'))
    
    # HIDDEN LAYER 1 - 256 neurons
    print(f"\n2️⃣ Adding Hidden Layer 1")
    print(f"   Neurons: {config.HIDDEN_LAYER_1}")
    print(f"   Activation: {config.HIDDEN_ACTIVATION}")
    model.add(layers.Dense(
        units=config.HIDDEN_LAYER_1,
        activation=config.HIDDEN_ACTIVATION,
        name='hidden_layer_1'
    ))
    
    # HIDDEN LAYER 2 - 128 neurons
    print(f"\n3️⃣ Adding Hidden Layer 2")
    print(f"   Neurons: {config.HIDDEN_LAYER_2}")
    print(f"   Activation: {config.HIDDEN_ACTIVATION}")
    model.add(layers.Dense(
        units=config.HIDDEN_LAYER_2,
        activation=config.HIDDEN_ACTIVATION,
        name='hidden_layer_2'
    ))
    
    # HIDDEN LAYER 3 - 64 neurons
    print(f"\n4️⃣ Adding Hidden Layer 3")
    print(f"   Neurons: {config.HIDDEN_LAYER_3}")
    print(f"   Activation: {config.HIDDEN_ACTIVATION}")
    model.add(layers.Dense(
        units=config.HIDDEN_LAYER_3,
        activation=config.HIDDEN_ACTIVATION,
        name='hidden_layer_3'
    ))
    
    # OUTPUT LAYER - 1 neuron (binary classification)
    print(f"\n5️⃣ Adding Output Layer")
    print(f"   Neurons: 1")
    print(f"   Activation: {config.OUTPUT_ACTIVATION} (outputs probability 0-1)")
    model.add(layers.Dense(
        units=1,
        activation=config.OUTPUT_ACTIVATION,
        name='output_layer'
    ))
    
    # COMPILE MODEL
    print(f"\n6️⃣ Compiling Model")
    print(f"   Optimizer: {config.OPTIMIZER} (learning_rate={config.LEARNING_RATE})")
    print(f"   Loss: {config.LOSS_FUNCTION}")
    print(f"   Metrics: {config.METRICS} + Precision + Recall")
    
    # Use proper metric objects for Precision and Recall
    from tensorflow.keras.metrics import Precision, Recall
    
    metrics = config.METRICS + [
        Precision(name='precision'),
        Recall(name='recall')
    ]
    
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=config.LEARNING_RATE),
        loss=config.LOSS_FUNCTION,
        metrics=metrics
    )
    
    print("\n✅ Model built and compiled successfully!")
    print("="*60)
    
    return model


def get_model_summary(model):
    """
    Print detailed model architecture and parameter info
    
    Parameters:
    -----------
    model : keras.Model
        The neural network model
    """
    print("\n" + "="*60)
    print("🧠 MODEL ARCHITECTURE SUMMARY")
    print("="*60)
    
    # Print Keras summary
    model.summary()
    
    print("="*60)
    
    # Calculate total parameters
    trainable_params = sum([tf.size(w).numpy() for w in model.trainable_weights])
    non_trainable_params = sum([tf.size(w).numpy() for w in model.non_trainable_weights])
    total_params = trainable_params + non_trainable_params
    
    print(f"\n📊 PARAMETER BREAKDOWN:")
    print(f"   Trainable Parameters:     {trainable_params:,}")
    print(f"   Non-trainable Parameters: {non_trainable_params:,}")
    print(f"   Total Parameters:         {total_params:,}")
    
    print(f"\n💾 ESTIMATED MODEL SIZE:")
    # Each parameter is typically 4 bytes (float32)
    size_mb = (total_params * 4) / (1024 * 1024)
    print(f"   ~{size_mb:.2f} MB")
    
    print(f"\n🔗 ARCHITECTURE FLOW:")
    print(f"   Input (128×128×1)")
    print(f"      ↓")
    print(f"   Flatten → 16,384 nodes")
    print(f"      ↓")
    print(f"   Dense ({config.HIDDEN_LAYER_1}) + ReLU")
    print(f"      ↓")
    print(f"   Dense ({config.HIDDEN_LAYER_2}) + ReLU")
    print(f"      ↓")
    print(f"   Dense ({config.HIDDEN_LAYER_3}) + ReLU")
    print(f"      ↓")
    print(f"   Dense (1) + Sigmoid")
    print(f"      ↓")
    print(f"   Output: Probability (0.0 - 1.0)")
    
    print("="*60)


def save_model(model, model_name='signature_model'):
    """
    Save the trained model to disk
    Saves in multiple formats for compatibility
    
    Parameters:
    -----------
    model : keras.Model
        Trained neural network model
    model_name : str
        Name for the saved model (without extension)
    
    Returns:
    --------
    save_paths : dict
        Dictionary containing paths where model was saved
    """
    
    print("\n" + "="*60)
    print("💾 SAVING MODEL")
    print("="*60)
    
    # Create saved_models directory if it doesn't exist
    os.makedirs(config.SAVED_MODELS_DIR, exist_ok=True)
    
    save_paths = {}
    
    # 1. Save in native Keras format (.keras) - RECOMMENDED
    keras_path = os.path.join(config.SAVED_MODELS_DIR, f'{model_name}.keras')
    print(f"\n1️⃣ Saving in Keras format (.keras)...")
    model.save(keras_path)
    save_paths['keras'] = keras_path
    print(f"   ✓ Saved to: {keras_path}")
    
    # 2. Save in H5 format (.h5) - Legacy format
    h5_path = os.path.join(config.SAVED_MODELS_DIR, f'{model_name}.h5')
    print(f"\n2️⃣ Saving in H5 format (.h5)...")
    model.save(h5_path)
    save_paths['h5'] = h5_path
    print(f"   ✓ Saved to: {h5_path}")
    
    # 3. Save model weights only
    weights_path = os.path.join(config.SAVED_MODELS_DIR, f'{model_name}_weights.h5')
    print(f"\n3️⃣ Saving model weights only...")
    model.save_weights(weights_path)
    save_paths['weights'] = weights_path
    print(f"   ✓ Saved to: {weights_path}")
    
    # 4. Save model architecture as JSON (optional - for documentation)
    json_path = os.path.join(config.SAVED_MODELS_DIR, f'{model_name}_architecture.json')
    print(f"\n4️⃣ Saving model architecture (JSON)...")
    model_json = model.to_json()
    with open(json_path, 'w') as json_file:
        json_file.write(model_json)
    save_paths['json'] = json_path
    print(f"   ✓ Saved to: {json_path}")
    
    print("\n" + "="*60)
    print("✅ MODEL SAVED SUCCESSFULLY!")
    print("="*60)
    print("\n📁 Saved Files:")
    for format_type, path in save_paths.items():
        file_size = os.path.getsize(path) / (1024 * 1024)  # Convert to MB
        print(f"   {format_type.upper():8s}: {path} ({file_size:.2f} MB)")
    print("="*60)
    
    return save_paths


def load_model(model_name='signature_model', format='keras'):
    """
    Load a saved model from disk
    
    Parameters:
    -----------
    model_name : str
        Name of the saved model (without extension)
    format : str
        Format to load: 'keras', 'h5', or 'weights'
        - 'keras': Load complete model (recommended)
        - 'h5': Load complete model (legacy)
        - 'weights': Load architecture + weights separately
    
    Returns:
    --------
    model : keras.Model
        Loaded neural network model
    """
    
    print("\n" + "="*60)
    print("📂 LOADING MODEL")
    print("="*60)
    
    if format == 'keras':
        model_path = os.path.join(config.SAVED_MODELS_DIR, f'{model_name}.keras')
        print(f"\n📥 Loading from Keras format...")
        print(f"   Path: {model_path}")
        
        if not os.path.exists(model_path):
            print(f"\n❌ ERROR: Model file not found at {model_path}")
            return None
        
        model = keras.models.load_model(model_path)
        print(f"   ✓ Model loaded successfully!")
        
    elif format == 'h5':
        model_path = os.path.join(config.SAVED_MODELS_DIR, f'{model_name}.h5')
        print(f"\n📥 Loading from H5 format...")
        print(f"   Path: {model_path}")
        
        if not os.path.exists(model_path):
            print(f"\n❌ ERROR: Model file not found at {model_path}")
            return None
        
        model = keras.models.load_model(model_path)
        print(f"   ✓ Model loaded successfully!")
        
    elif format == 'weights':
        weights_path = os.path.join(config.SAVED_MODELS_DIR, f'{model_name}_weights.h5')
        print(f"\n📥 Loading weights only...")
        print(f"   Path: {weights_path}")
        
        if not os.path.exists(weights_path):
            print(f"\n❌ ERROR: Weights file not found at {weights_path}")
            return None
        
        # Need to rebuild architecture first
        print(f"   ⚙️  Rebuilding model architecture...")
        model = build_model()
        
        # Load weights
        print(f"   📥 Loading saved weights...")
        model.load_weights(weights_path)
        print(f"   ✓ Weights loaded successfully!")
        
    else:
        print(f"\n❌ ERROR: Invalid format '{format}'")
        print(f"   Valid formats: 'keras', 'h5', 'weights'")
        return None
    
    print("\n" + "="*60)
    print("✅ MODEL LOADED SUCCESSFULLY!")
    print("="*60)
    
    return model


def list_saved_models():
    """
    List all saved models in the saved_models directory
    
    Returns:
    --------
    models : list
        List of saved model names
    """
    
    print("\n" + "="*60)
    print("📋 AVAILABLE SAVED MODELS")
    print("="*60)
    
    if not os.path.exists(config.SAVED_MODELS_DIR):
        print("\n⚠️  No saved_models directory found!")
        print(f"   Expected location: {config.SAVED_MODELS_DIR}")
        return []
    
    files = os.listdir(config.SAVED_MODELS_DIR)
    
    keras_models = [f.replace('.keras', '') for f in files if f.endswith('.keras')]
    h5_models = [f.replace('.h5', '') for f in files if f.endswith('.h5') and not f.endswith('_weights.h5')]
    
    if not keras_models and not h5_models:
        print("\n⚠️  No saved models found!")
        return []