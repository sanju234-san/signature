"""
Configuration file for Signature Verification Project
Contains all hyperparameters and settings
"""

import os

# ==================== PROJECT PATHS ====================
# These define where all your folders are located

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# BASE_DIR = Current directory where config.py is located
# Example: C:/Users/YourName/Desktop/signature/server/

DATA_DIR = os.path.join(BASE_DIR, 'data')
# DATA_DIR = BASE_DIR + 'data'
# Example: C:/Users/YourName/Desktop/signature/server/data/

TRAIN_DIR = os.path.join(DATA_DIR, 'train')
# Where training images are stored
# Example: .../server/data/train/

TEST_DIR = os.path.join(DATA_DIR, 'test')
# Where test images are stored
# Example: .../server/data/test/

VALIDATION_DIR = os.path.join(DATA_DIR, 'validation')
# Where validation images are stored
# Example: .../server/data/validation/

SAVED_MODELS_DIR = os.path.join(BASE_DIR, 'saved_models')
# Where trained models will be saved
# Example: .../server/saved_models/


# ==================== DATA SETTINGS ====================
# These define what kind of images we're working with

IMAGE_SIZE = (128, 128)
# Width x Height in pixels
# We resize ALL signatures to this size
# Why 128x128? Balance between detail and speed (we discussed this!)

CHANNELS = 1
# Number of color channels
# 1 = Grayscale (black & white)
# 3 = RGB (color)
# Signatures work better in grayscale

INPUT_SHAPE = (128, 128, 1)
# TensorFlow format: (height, width, channels)
# This is what the neural network expects as input
# 128 x 128 x 1 = 16,384 pixels


# Training/Validation/Test Split percentages
TRAIN_SPLIT = 0.7       # 70% of data for training
VALIDATION_SPLIT = 0.15 # 15% of data for validation
TEST_SPLIT = 0.15       # 15% of data for testing


# ==================== MODEL ARCHITECTURE ====================
# These define the structure of our neural network

HIDDEN_LAYER_1 = 256
# First hidden layer has 256 neurons
# These detect basic patterns (lines, curves)

HIDDEN_LAYER_2 = 128
# Second hidden layer has 128 neurons
# These combine basic patterns into complex ones

HIDDEN_LAYER_3 = 64
# Third hidden layer has 64 neurons
# These recognize high-level signature features

# Notice the pattern: 256 → 128 → 64 (decreasing)
# This "funnels" information from 16,384 inputs to 1 output


# Activation functions (we learned these!)
HIDDEN_ACTIVATION = 'relu'
# ReLU for hidden layers
# ReLU(x) = max(0, x)
# Fast, works great for hidden layers

OUTPUT_ACTIVATION = 'sigmoid'
# Sigmoid for output layer
# Sigmoid(x) = 1 / (1 + e^(-x))
# Gives output between 0 and 1 (perfect for probability!)


# ==================== TRAINING HYPERPARAMETERS ====================
# These control HOW the network learns

LEARNING_RATE = 0.001
# How big each weight update step is
# 0.001 = small, careful steps
# Think of it as "learning speed"
# Too high (0.1) = unstable, bounces around
# Too low (0.00001) = takes forever
# 0.001 is a sweet spot

BATCH_SIZE = 32
# Number of images processed before updating weights
# We don't update after EACH image
# We process 32 images, then update weights
# Why 32? Good balance between speed and accuracy
# Larger = faster but less precise
# Smaller = slower but more precise

EPOCHS = 50
# How many times to go through the ENTIRE dataset
# 1 epoch = see all training images once
# 50 epochs = see all images 50 times
# Network learns more with each pass

# Early stopping prevents overfitting
EARLY_STOPPING_PATIENCE = 10
# If validation loss doesn't improve for 10 epochs → STOP
# Prevents the network from "memorizing" instead of "learning"


# ==================== OPTIMIZER ====================
# Algorithm used for gradient descent (updating weights)

OPTIMIZER = 'adam'
# Adam = Adaptive Moment Estimation
# Smart version of gradient descent
# Automatically adjusts learning rate
# Very popular, works great
# Alternative: 'sgd' (simpler but slower)


# ==================== LOSS FUNCTION ====================
# Measures how wrong the predictions are

LOSS_FUNCTION = 'binary_crossentropy'
# Perfect for binary classification (2 classes)
# Class 0 = Forged
# Class 1 = Genuine
# Measures the difference between predicted and actual
# Lower loss = better predictions


# ==================== METRICS ====================
# What to track during training
# NOTE: Only use 'accuracy' as string. Precision and Recall are added as objects in model.py

METRICS = ['accuracy']
# Accuracy = % of correct predictions
# Precision and Recall will be added as metric objects in model.py


# ==================== PREDICTION SETTINGS ====================
# How to interpret the network's output

CONFIDENCE_THRESHOLD = 0.5
# Decision boundary
# If output >= 0.5 → Predict GENUINE (1)
# If output < 0.5 → Predict FORGED (0)
# 
# Example:
# Output = 0.87 → 0.87 >= 0.5 → GENUINE
# Output = 0.23 → 0.23 < 0.5 → FORGED


# ==================== RANDOM SEED ====================
# For reproducibility (get same results every time)

RANDOM_SEED = 42
# Magic number that makes randomness "predictable"
# Same seed = same random numbers every time
# Useful for debugging and comparing experiments
# 42 is traditional (from "Hitchhiker's Guide to the Galaxy")


# ==================== VERBOSITY ====================
# How much information to print during training

VERBOSE = 1
# 0 = Silent (no output)
# 1 = Progress bar (recommended)
# 2 = One line per epoch


# ==================== PRINT CONFIGURATION (for verification) ====================
print("=" * 60)
print("✓ Configuration loaded successfully!")
print("=" * 60)
print(f"Image Settings:")
print(f"  - Image Size: {IMAGE_SIZE}")
print(f"  - Channels: {CHANNELS} (Grayscale)")
print(f"  - Input Shape: {INPUT_SHAPE}")
print(f"\nNetwork Architecture:")
print(f"  - Hidden Layer 1: {HIDDEN_LAYER_1} neurons")
print(f"  - Hidden Layer 2: {HIDDEN_LAYER_2} neurons")
print(f"  - Hidden Layer 3: {HIDDEN_LAYER_3} neurons")
print(f"  - Total: 16,384 → {HIDDEN_LAYER_1} → {HIDDEN_LAYER_2} → {HIDDEN_LAYER_3} → 1")
print(f"\nTraining Settings:")
print(f"  - Learning Rate: {LEARNING_RATE}")
print(f"  - Batch Size: {BATCH_SIZE}")
print(f"  - Epochs: {EPOCHS}")
print(f"  - Optimizer: {OPTIMIZER}")
print(f"\nPrediction:")
print(f"  - Threshold: {CONFIDENCE_THRESHOLD}")
print("=" * 60)