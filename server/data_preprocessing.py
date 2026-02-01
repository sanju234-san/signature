"""
Data Preprocessing for Signature Verification
Loads images, preprocesses them, and prepares them for training
"""

import os
import numpy as np
import cv2
from sklearn.model_selection import train_test_split
import config

def load_images_from_folder(folder_path, label):
    """
    Load all images from a folder and assign them a label
    
    Parameters:
    -----------
    folder_path : str
        Path to folder containing images
    label : int
        0 for forged, 1 for genuine
    
    Returns:
    --------
    images : numpy array
        Array of preprocessed images
    labels : numpy array
        Array of corresponding labels
    """
    images = []
    labels = []
    
    print(f"\n📂 Loading images from: {folder_path}")
    
    if not os.path.exists(folder_path):
        print(f"❌ ERROR: Folder not found: {folder_path}")
        return np.array([]), np.array([])
    
    # List ALL files to debug
    all_files = os.listdir(folder_path)
    print(f"🔍 DEBUG: Found {len(all_files)} total files in folder")
    if len(all_files) > 0 and len(all_files) <= 5:
        print(f"🔍 DEBUG: Files are: {all_files}")
    
    # Get list of image files
    image_files = [f for f in all_files 
                   if f.lower().endswith(('.png', '.jpg', '.jpeg', '.bmp', '.tiff'))]
    
    print(f"📸 Found {len(image_files)} image files")
    
    for idx, filename in enumerate(image_files):
        img_path = os.path.join(folder_path, filename)
        
        # Read image in grayscale (1 channel)
        img = cv2.imread(img_path, cv2.IMREAD_GRAYSCALE)
        
        if img is not None:
            # Resize to standard size (128x128)
            img = cv2.resize(img, config.IMAGE_SIZE)
            
            # Normalize pixel values: 0-255 → 0-1
            # This helps the neural network learn better!
            img = img / 255.0
            
            images.append(img)
            labels.append(label)
            
            # Progress indicator
            if (idx + 1) % 50 == 0:
                print(f"  ✓ Processed {idx + 1}/{len(image_files)} images")
        else:
            print(f"  ⚠ Warning: Could not read {filename}")
    
    print(f"✅ Successfully loaded {len(images)} images")
    
    return np.array(images), np.array(labels)


def prepare_dataset():
    """
    Load all signature data and split into train/validation/test sets
    Works with structure: Dataset/user_folders/genuine_images or skilled_forgery_images
    
    Returns:
    --------
    train_data : tuple (X_train, y_train)
    val_data : tuple (X_val, y_val)
    test_data : tuple (X_test, y_test)
    """
    
    print("="*60)
    print("🚀 STARTING DATA PREPARATION")
    print("="*60)
    
    dataset_path = os.path.join(config.BASE_DIR, 'Dataset')
    
    # Lists to store all images and labels
    all_genuine_images = []
    all_genuine_labels = []
    all_forged_images = []
    all_forged_labels = []
    
    # Get all user folders (u07, u09, u014, etc.)
    user_folders = [f for f in os.listdir(dataset_path) 
                    if os.path.isdir(os.path.join(dataset_path, f))]
    
    print(f"\n📂 Found {len(user_folders)} user folders: {user_folders}")
    
    # Iterate through each user folder
    for user_folder in user_folders:
        user_path = os.path.join(dataset_path, user_folder)
        
        print(f"\n👤 Processing user: {user_folder}")
        
        # Path to genuine signatures - checking multiple possible structures
        genuine_path = os.path.join(user_path, 'genuine', 'images')
        if not os.path.exists(genuine_path):
            genuine_path = os.path.join(user_path, 'genuine_images')
        if not os.path.exists(genuine_path):
            genuine_path = os.path.join(user_path, 'genuine')
        
        # Path to forged signatures - checking multiple possible structures
        # Most common: 'skilled forgery' with SPACE
        forged_path = os.path.join(user_path, 'skilled forgery', 'images')
        if not os.path.exists(forged_path):
            forged_path = os.path.join(user_path, 'skilled_forgery', 'images')
        if not os.path.exists(forged_path):
            forged_path = os.path.join(user_path, 'skilled_forgery_images')
        if not os.path.exists(forged_path):
            forged_path = os.path.join(user_path, 'forged_images')
        if not os.path.exists(forged_path):
            forged_path = os.path.join(user_path, 'forged', 'images')
        if not os.path.exists(forged_path):
            forged_path = os.path.join(user_path, 'skilled forgery')
        if not os.path.exists(forged_path):
            forged_path = os.path.join(user_path, 'skilled_forgery')
        
        # Load genuine signatures (label = 1)
        if os.path.exists(genuine_path):
            print(f"  📝 Loading genuine signatures from {user_folder}...")
            genuine_imgs, genuine_lbls = load_images_from_folder(genuine_path, label=1)
            if len(genuine_imgs) > 0:
                all_genuine_images.append(genuine_imgs)
                all_genuine_labels.append(genuine_lbls)
            else:
                print(f"     ⚠ No valid images loaded from genuine folder")
        else:
            print(f"  ⚠ Warning: No 'genuine' folder found for {user_folder}")
            print(f"     Tried path: {genuine_path}")
        
        # Load forged signatures (label = 0)
        if os.path.exists(forged_path):
            print(f"  🖊️ Loading forged signatures from {user_folder}...")
            forged_imgs, forged_lbls = load_images_from_folder(forged_path, label=0)
            if len(forged_imgs) > 0:
                all_forged_images.append(forged_imgs)
                all_forged_labels.append(forged_lbls)
            else:
                print(f"     ⚠ No valid images loaded from forged folder")
        else:
            print(f"  ⚠ Warning: No 'skilled_forgery' or 'forged' folder found for {user_folder}")
            print(f"     🔍 DEBUG: Checked path: {forged_path}")
            print(f"     🔍 DEBUG: User path contents: {os.listdir(user_path)}")
    
    # Combine all genuine signatures from all users
    print("\n1️⃣ Combining GENUINE signatures from all users...")
    if all_genuine_images:
        genuine_images = np.concatenate(all_genuine_images, axis=0)
        genuine_labels = np.concatenate(all_genuine_labels, axis=0)
        print(f"   Total genuine images: {len(genuine_images)}")
    else:
        genuine_images = np.array([])
        genuine_labels = np.array([])
        print(f"   ⚠ No genuine images loaded!")
    
    # Combine all forged signatures from all users
    print("2️⃣ Combining FORGED signatures from all users...")
    if all_forged_images:
        forged_images = np.concatenate(all_forged_images, axis=0)
        forged_labels = np.concatenate(all_forged_labels, axis=0)
        print(f"   Total forged images: {len(forged_images)}")
    else:
        forged_images = np.array([])
        forged_labels = np.array([])
        print(f"   ⚠ No forged images loaded!")
    
    # Check if data was loaded
    if len(genuine_images) == 0 or len(forged_images) == 0:
        print("\n❌ ERROR: No images found!")
        print("Please check your Dataset folder structure:")
        print("  Dataset/")
        print("    └── u07/ (or other user folders)")
        print("        ├── genuine_images/")
        print("        └── skilled_forgery_images/")
        return None, None, None
    
    # Combine genuine and forged signatures
    print("\n3️⃣ Combining datasets...")
    X = np.concatenate([genuine_images, forged_images], axis=0)
    y = np.concatenate([genuine_labels, forged_labels], axis=0)
    
    print(f"  Total images: {len(X)}")
    print(f"  - Genuine: {len(genuine_images)}")
    print(f"  - Forged: {len(forged_images)}")
    
    # Reshape for neural network
    # Add channel dimension: (samples, height, width) → (samples, height, width, channels)
    print("\n4️⃣ Reshaping data for neural network...")
    X = X.reshape(-1, config.INPUT_SHAPE[0], config.INPUT_SHAPE[1], config.INPUT_SHAPE[2])
    print(f"  Shape: {X.shape}")
    print(f"  Interpretation: ({X.shape[0]} images, {X.shape[1]}x{X.shape[2]} pixels, {X.shape[3]} channel)")
    
    # Split into training and temporary set (validation + test)
    print("\n5️⃣ Splitting dataset...")
    X_train, X_temp, y_train, y_temp = train_test_split(
        X, y, 
        test_size=(config.VALIDATION_SPLIT + config.TEST_SPLIT),  # 0.30
        random_state=config.RANDOM_SEED,
        stratify=y  # Maintains class balance
    )
    
    # Split temporary set into validation and test
    X_val, X_test, y_val, y_test = train_test_split(
        X_temp, y_temp,
        test_size=0.5,  # Split 30% into two 15% sets
        random_state=config.RANDOM_SEED,
        stratify=y_temp
    )
    
    # Print split summary
    print("="*60)
    print("✅ DATASET PREPARATION COMPLETE!")
    print("="*60)
    print(f"\n📊 Dataset Split:")
    print(f"  Training:   {len(X_train)} images ({len(X_train)/len(X)*100:.1f}%)")
    print(f"  Validation: {len(X_val)} images ({len(X_val)/len(X)*100:.1f}%)")
    print(f"  Testing:    {len(X_test)} images ({len(X_test)/len(X)*100:.1f}%)")
    print(f"  Total:      {len(X)} images")
    
    print(f"\n🎯 Class Distribution:")
    print(f"  Training - Genuine: {sum(y_train)}, Forged: {len(y_train) - sum(y_train)}")
    print(f"  Validation - Genuine: {sum(y_val)}, Forged: {len(y_val) - sum(y_val)}")
    print(f"  Testing - Genuine: {sum(y_test)}, Forged: {len(y_test) - sum(y_test)}")
    print("="*60)
    
    return (X_train, y_train), (X_val, y_val), (X_test, y_test)


def visualize_sample_images(X, y, num_samples=5):
    """
    Display sample images to verify preprocessing
    (Optional - for debugging)
    """
    import matplotlib.pyplot as plt
    
    fig, axes = plt.subplots(1, num_samples, figsize=(15, 3))
    
    for i in range(num_samples):
        axes[i].imshow(X[i].reshape(config.IMAGE_SIZE), cmap='gray')
        label = "GENUINE" if y[i] == 1 else "FORGED"
        axes[i].set_title(f"{label}")
        axes[i].axis('off')
    
    plt.tight_layout()
    plt.show()


# Test the preprocessing (run this file directly to test)
if __name__ == "__main__":
    print("\n🧪 TESTING DATA PREPROCESSING MODULE")
    print("="*60)
    
    # Load and prepare dataset
    train_data, val_data, test_data = prepare_dataset()
    
    if train_data is not None:
        X_train, y_train = train_data
        
        print("\n📋 Sample Data Info:")
        print(f"  First image shape: {X_train[0].shape}")
        print(f"  First image min value: {X_train[0].min()}")
        print(f"  First image max value: {X_train[0].max()}")
        print(f"  First label: {y_train[0]} ({'GENUINE' if y_train[0] == 1 else 'FORGED'})")
        
        print("\n✅ Data preprocessing module working correctly!")
    else:
        print("\n❌ Data preprocessing failed. Check your Dataset folder.")