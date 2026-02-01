"""
Training Script for Signature Verification Model
Trains the neural network and saves the best model
"""

import os
import numpy as np
import matplotlib.pyplot as plt
from datetime import datetime
import tensorflow as tf
from tensorflow import keras

# Import our custom modules
import config
import data_preprocessing
import model

def plot_training_history(history, save_path=None):
    """
    Plot training history (loss and metrics)
    
    Parameters:
    -----------
    history : keras.callbacks.History
        Training history object
    save_path : str
        Path to save the plot (optional)
    """
    
    print("\n" + "="*60)
    print("📊 PLOTTING TRAINING HISTORY")
    print("="*60)
    
    # Create figure with subplots
    fig, axes = plt.subplots(2, 2, figsize=(15, 10))
    fig.suptitle('Training History - Signature Verification Model', fontsize=16, fontweight='bold')
    
    # Plot 1: Loss
    axes[0, 0].plot(history.history['loss'], label='Training Loss', linewidth=2)
    axes[0, 0].plot(history.history['val_loss'], label='Validation Loss', linewidth=2)
    axes[0, 0].set_title('Model Loss', fontsize=12, fontweight='bold')
    axes[0, 0].set_xlabel('Epoch')
    axes[0, 0].set_ylabel('Loss')
    axes[0, 0].legend()
    axes[0, 0].grid(True, alpha=0.3)
    
    # Plot 2: Accuracy
    axes[0, 1].plot(history.history['accuracy'], label='Training Accuracy', linewidth=2)
    axes[0, 1].plot(history.history['val_accuracy'], label='Validation Accuracy', linewidth=2)
    axes[0, 1].set_title('Model Accuracy', fontsize=12, fontweight='bold')
    axes[0, 1].set_xlabel('Epoch')
    axes[0, 1].set_ylabel('Accuracy')
    axes[0, 1].legend()
    axes[0, 1].grid(True, alpha=0.3)
    
    # Plot 3: Precision
    if 'precision' in history.history:
        axes[1, 0].plot(history.history['precision'], label='Training Precision', linewidth=2)
        axes[1, 0].plot(history.history['val_precision'], label='Validation Precision', linewidth=2)
        axes[1, 0].set_title('Model Precision', fontsize=12, fontweight='bold')
        axes[1, 0].set_xlabel('Epoch')
        axes[1, 0].set_ylabel('Precision')
        axes[1, 0].legend()
        axes[1, 0].grid(True, alpha=0.3)
    
    # Plot 4: Recall
    if 'recall' in history.history:
        axes[1, 1].plot(history.history['recall'], label='Training Recall', linewidth=2)
        axes[1, 1].plot(history.history['val_recall'], label='Validation Recall', linewidth=2)
        axes[1, 1].set_title('Model Recall', fontsize=12, fontweight='bold')
        axes[1, 1].set_xlabel('Epoch')
        axes[1, 1].set_ylabel('Recall')
        axes[1, 1].legend()
        axes[1, 1].grid(True, alpha=0.3)
    
    plt.tight_layout()
    
    # Save plot if path provided
    if save_path:
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        print(f"   ✓ Plot saved to: {save_path}")
    
    plt.show()
    
    print("="*60)


def train_model(X_train, y_train, X_val, y_val, model_obj):
    """
    Train the neural network model
    
    Parameters:
    -----------
    X_train : numpy array
        Training images
    y_train : numpy array
        Training labels
    X_val : numpy array
        Validation images
    y_val : numpy array
        Validation labels
    model_obj : keras.Model
        The neural network model to train
    
    Returns:
    --------
    history : keras.callbacks.History
        Training history
    model_obj : keras.Model
        Trained model
    """
    
    print("\n" + "="*60)
    print("🚀 STARTING MODEL TRAINING")
    print("="*60)
    
    print(f"\n📊 Training Configuration:")
    print(f"   Epochs: {config.EPOCHS}")
    print(f"   Batch Size: {config.BATCH_SIZE}")
    print(f"   Learning Rate: {config.LEARNING_RATE}")
    print(f"   Optimizer: {config.OPTIMIZER}")
    print(f"   Early Stopping Patience: {config.EARLY_STOPPING_PATIENCE}")
    
    print(f"\n📈 Dataset Sizes:")
    print(f"   Training samples: {len(X_train)}")
    print(f"   Validation samples: {len(X_val)}")
    print(f"   Steps per epoch: {len(X_train) // config.BATCH_SIZE}")
    
    # Create callbacks
    callbacks = []
    
    # 1. Early Stopping - prevents overfitting
    early_stopping = keras.callbacks.EarlyStopping(
        monitor='val_loss',
        patience=config.EARLY_STOPPING_PATIENCE,
        restore_best_weights=True,
        verbose=1
    )
    callbacks.append(early_stopping)
    print(f"\n✓ Early Stopping enabled (patience={config.EARLY_STOPPING_PATIENCE})")
    
    # 2. Model Checkpoint - saves best model during training
    os.makedirs(config.SAVED_MODELS_DIR, exist_ok=True)
    checkpoint_path = os.path.join(config.SAVED_MODELS_DIR, 'best_model_checkpoint.keras')
    model_checkpoint = keras.callbacks.ModelCheckpoint(
        filepath=checkpoint_path,
        monitor='val_accuracy',
        save_best_only=True,
        verbose=1
    )
    callbacks.append(model_checkpoint)
    print(f"✓ Model Checkpoint enabled (saves best model automatically)")
    
    # 3. Reduce Learning Rate on Plateau - adjusts LR if stuck
    reduce_lr = keras.callbacks.ReduceLROnPlateau(
        monitor='val_loss',
        factor=0.5,
        patience=5,
        min_lr=0.00001,
        verbose=1
    )
    callbacks.append(reduce_lr)
    print(f"✓ Learning Rate Reduction enabled")
    
    # Start training
    print("\n" + "="*60)
    print("🏋️  TRAINING IN PROGRESS...")
    print("="*60)
    print("\n")
    
    start_time = datetime.now()
    
    history = model_obj.fit(
        X_train, y_train,
        batch_size=config.BATCH_SIZE,
        epochs=config.EPOCHS,
        validation_data=(X_val, y_val),
        callbacks=callbacks,
        verbose=config.VERBOSE
    )
    
    end_time = datetime.now()
    training_duration = end_time - start_time
    
    print("\n" + "="*60)
    print("✅ TRAINING COMPLETED!")
    print("="*60)
    print(f"\n⏱️  Training Duration: {training_duration}")
    print(f"   Started:  {start_time.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"   Finished: {end_time.strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Print final metrics
    print(f"\n📊 Final Training Metrics:")
    final_epoch = len(history.history['loss'])
    print(f"   Epochs completed: {final_epoch}/{config.EPOCHS}")
    print(f"   Training Loss: {history.history['loss'][-1]:.4f}")
    print(f"   Training Accuracy: {history.history['accuracy'][-1]:.4f}")
    print(f"   Validation Loss: {history.history['val_loss'][-1]:.4f}")
    print(f"   Validation Accuracy: {history.history['val_accuracy'][-1]:.4f}")
    
    if 'precision' in history.history:
        print(f"   Validation Precision: {history.history['val_precision'][-1]:.4f}")
    if 'recall' in history.history:
        print(f"   Validation Recall: {history.history['val_recall'][-1]:.4f}")
    
    print("="*60)
    
    return history, model_obj


def evaluate_model(model_obj, X_test, y_test):
    """
    Evaluate the trained model on test data
    
    Parameters:
    -----------
    model_obj : keras.Model
        Trained model
    X_test : numpy array
        Test images
    y_test : numpy array
        Test labels
    """
    
    print("\n" + "="*60)
    print("🧪 EVALUATING MODEL ON TEST DATA")
    print("="*60)
    
    print(f"\n📊 Test Dataset:")
    print(f"   Total samples: {len(X_test)}")
    print(f"   Genuine: {sum(y_test)}")
    print(f"   Forged: {len(y_test) - sum(y_test)}")
    
    print(f"\n🔄 Running evaluation...")
    
    # Evaluate on test set
    test_results = model_obj.evaluate(X_test, y_test, verbose=0)
    
    print("\n" + "="*60)
    print("📈 TEST RESULTS")
    print("="*60)
    
    metric_names = model_obj.metrics_names
    for name, value in zip(metric_names, test_results):
        print(f"   {name.capitalize()}: {value:.4f}")
    
    # Make predictions
    print(f"\n🔮 Making predictions on test set...")
    y_pred_prob = model_obj.predict(X_test, verbose=0)
    y_pred = (y_pred_prob > config.CONFIDENCE_THRESHOLD).astype(int).flatten()
    
    # Calculate confusion matrix
    from sklearn.metrics import confusion_matrix, classification_report
    
    cm = confusion_matrix(y_test, y_pred)
    
    print("\n📊 Confusion Matrix:")
    print(f"                Predicted")
    print(f"                Forged  Genuine")
    print(f"   Actual Forged   {cm[0][0]:4d}    {cm[0][1]:4d}")
    print(f"   Actual Genuine  {cm[1][0]:4d}    {cm[1][1]:4d}")
    
    # Calculate metrics
    tn, fp, fn, tp = cm.ravel()
    
    print("\n📈 Detailed Metrics:")
    print(f"   True Negatives (TN):  {tn} (Correctly identified forged)")
    print(f"   False Positives (FP): {fp} (Forged classified as genuine)")
    print(f"   False Negatives (FN): {fn} (Genuine classified as forged)")
    print(f"   True Positives (TP):  {tp} (Correctly identified genuine)")
    
    # Classification report
    print("\n📋 Classification Report:")
    print(classification_report(y_test, y_pred, target_names=['Forged', 'Genuine']))
    
    print("="*60)
    
    return test_results


def main():
    """
    Main training pipeline
    """
    
    print("\n" + "="*70)
    print("🎯 SIGNATURE VERIFICATION - TRAINING PIPELINE")
    print("="*70)
    
    # Step 1: Load and prepare data
    print("\n" + "="*70)
    print("STEP 1: DATA PREPARATION")
    print("="*70)
    
    train_data, val_data, test_data = data_preprocessing.prepare_dataset()
    
    if train_data is None:
        print("\n❌ ERROR: Data preparation failed. Exiting...")
        return
    
    X_train, y_train = train_data
    X_val, y_val = val_data
    X_test, y_test = test_data
    
    # Step 2: Build model
    print("\n" + "="*70)
    print("STEP 2: MODEL BUILDING")
    print("="*70)
    
    model_obj = model.build_model()
    model.get_model_summary(model_obj)
    
    # Step 3: Train model
    print("\n" + "="*70)
    print("STEP 3: MODEL TRAINING")
    print("="*70)
    
    history, trained_model = train_model(X_train, y_train, X_val, y_val, model_obj)
    
    # Step 4: Save model
    print("\n" + "="*70)
    print("STEP 4: SAVING MODEL")
    print("="*70)
    
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    model_name = f'signature_model_{timestamp}'
    
    save_paths = model.save_model(trained_model, model_name=model_name)
    
    # Also save as default name for easy loading
    model.save_model(trained_model, model_name='signature_model_latest')
    
    # Step 5: Evaluate model
    print("\n" + "="*70)
    print("STEP 5: MODEL EVALUATION")
    print("="*70)
    
    test_results = evaluate_model(trained_model, X_test, y_test)
    
    # Step 6: Plot training history
    print("\n" + "="*70)
    print("STEP 6: VISUALIZING RESULTS")
    print("="*70)
    
    plot_save_path = os.path.join(config.SAVED_MODELS_DIR, f'training_history_{timestamp}.png')
    plot_training_history(history, save_path=plot_save_path)
    
    # Final summary
    print("\n" + "="*70)
    print("🎉 TRAINING PIPELINE COMPLETED SUCCESSFULLY!")
    print("="*70)
    
    print(f"\n📁 Saved Files:")
    print(f"   Model: {save_paths['keras']}")
    print(f"   Plot: {plot_save_path}")
    
    print(f"\n📊 Final Performance:")
    print(f"   Test Accuracy: {test_results[1]:.2%}")
    
    print(f"\n💡 Next Steps:")
    print(f"   1. Review training plots to check for overfitting")
    print(f"   2. Use predict.py to test on new signatures")
    print(f"   3. Deploy model in production application")
    
    print("\n" + "="*70)


if __name__ == "__main__":
    main()