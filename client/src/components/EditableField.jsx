import { useState, useRef, useEffect } from 'react';
import { Pencil, Check, X } from 'lucide-react';

export default function EditableField({
    value,
    onSave,
    type = 'text',
    className = '',
    placeholder = 'Click to edit',
    validate,
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(value);
    const [isSaving, setIsSaving] = useState(false);
    const inputRef = useRef(null);

    useEffect(() => {
        setEditValue(value);
    }, [value]);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const handleSave = async () => {
        if (validate && !validate(editValue)) {
            setEditValue(value);
            setIsEditing(false);
            return;
        }

        if (editValue !== value) {
            setIsSaving(true);
            try {
                await onSave(editValue);
            } catch (error) {
                console.error('Error saving:', error);
                setEditValue(value);
            }
            setIsSaving(false);
        }
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditValue(value);
        setIsEditing(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSave();
        } else if (e.key === 'Escape') {
            handleCancel();
        }
    };

    if (isEditing) {
        return (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                    ref={inputRef}
                    type={type}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={handleSave}
                    className="editable-input"
                    disabled={isSaving}
                    style={{ minWidth: '100px' }}
                />
                <button
                    onClick={handleSave}
                    style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '0.25rem',
                        color: 'var(--success)',
                    }}
                >
                    <Check size={14} />
                </button>
                <button
                    onClick={handleCancel}
                    style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '0.25rem',
                        color: 'var(--error)',
                    }}
                >
                    <X size={14} />
                </button>
            </div>
        );
    }

    return (
        <span
            className={`editable-field ${className}`}
            onClick={() => setIsEditing(true)}
            title="Click to edit"
        >
            <span>{value || placeholder}</span>
            <Pencil size={12} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
        </span>
    );
}
