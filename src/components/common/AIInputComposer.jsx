import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { ArrowUp, Image, MicFill, X } from 'react-bootstrap-icons';
import { toast } from 'react-toastify';
import styles from './AIInputComposer.module.scss';

const MAX_IMAGE_BYTES = 1.5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

async function prepareImage(file) {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        throw new Error('Choose a JPEG, PNG, or WebP image.');
    }

    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 2000 / Math.max(bitmap.width, bitmap.height));
    let width = Math.round(bitmap.width * scale);
    let height = Math.round(bitmap.height * scale);
    let quality = 0.86;
    let blob;

    for (let attempt = 0; attempt < 6; attempt += 1) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d');
        context.fillStyle = '#fff';
        context.fillRect(0, 0, width, height);
        context.drawImage(bitmap, 0, 0, width, height);
        blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
        if (!blob) {
            bitmap.close();
            throw new Error('Could not process this image. Try another file.');
        }
        if (blob.size <= MAX_IMAGE_BYTES) break;
        quality = Math.max(0.5, quality - 0.08);
        width = Math.round(width * 0.85);
        height = Math.round(height * 0.85);
    }

    bitmap.close();
    if (blob.size > MAX_IMAGE_BYTES) throw new Error('This image is too large to process. Choose a smaller image.');

    const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Could not read this image. Try another file.'));
        reader.readAsDataURL(blob);
    });

    return {
        data: dataUrl.split(',')[1],
        mimeType: 'image/jpeg',
        previewUrl: URL.createObjectURL(blob),
        name: file.name,
    };
}

function AIInputComposer({ value, onChange, onSubmit, placeholder, busy, disabled, resetKey }) {
    const [image, setImage] = useState(null);
    const [preparingImage, setPreparingImage] = useState(false);
    const inputRef = useRef(null);
    const textareaRef = useRef(null);

    useEffect(() => () => {
        if (image?.previewUrl) URL.revokeObjectURL(image.previewUrl);
    }, [image]);

    useEffect(() => {
        setImage(null);
    }, [resetKey]);

    const handleFileChange = async (event) => {
        const [file] = event.target.files || [];
        event.target.value = '';
        if (!file) return;

        setPreparingImage(true);
        try {
            setImage(await prepareImage(file));
        } catch (error) {
            toast.error(error.message || 'Could not process this image.');
        } finally {
            setPreparingImage(false);
        }
    };

    const submit = () => {
        if (disabled || busy || preparingImage || (!value.trim() && !image) || !onSubmit) return;
        onSubmit({
            text: value.trim(),
            image: image ? { data: image.data, mimeType: image.mimeType } : null,
        });
    };

    const handleKeyDown = (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            submit();
        }
    };

    return (
        <div className={styles.promptBox} aria-busy={busy || preparingImage}>
            <input ref={inputRef} className={styles.hiddenFileInput} type="file" accept={ACCEPTED_IMAGE_TYPES.join(',')} onChange={handleFileChange} aria-label="Choose receipt or payment image" />
            <textarea
                ref={textareaRef}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                rows="2"
                aria-label="Describe the transaction"
                disabled={disabled}
            />
            {image && <div className={styles.receiptPreview}><img src={image.previewUrl} alt="Selected transaction image preview" /><span title={image.name}>{image.name}</span><button type="button" onClick={() => setImage(null)} aria-label="Remove image" title="Remove image"><X size={15} /></button></div>}
            <div className={styles.promptActions}>
                <div className={styles.promptTools}>
                    <button type="button" className={styles.promptToolButton} disabled={disabled || busy || preparingImage} onClick={() => inputRef.current?.click()} title="Attach a receipt or payment screenshot" aria-label="Attach image"><Image size={17} /></button>
                    <button type="button" className={styles.promptToolButton} disabled={disabled} title="For voice input, please use your keyboard microphone." aria-label="For voice input, please use your keyboard microphone" onClick={() => textareaRef.current?.focus()}><MicFill size={16} /></button>
                </div>
                <button type="button" className={styles.promptSendButton} disabled={disabled || busy || preparingImage || (!value.trim() && !image) || !onSubmit} onClick={submit} aria-label="Submit transaction prompt" title={onSubmit ? 'Analyze transactions' : 'AI extraction will be connected here'}>{busy ? <span className={styles.spinner} /> : <ArrowUp size={19} />}</button>
            </div>
        </div>
    );
}

AIInputComposer.propTypes = {
    value: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    onSubmit: PropTypes.func,
    placeholder: PropTypes.string,
    busy: PropTypes.bool,
    disabled: PropTypes.bool,
    resetKey: PropTypes.number,
};

AIInputComposer.defaultProps = {
    onSubmit: null,
    placeholder: 'Describe a transaction…',
    busy: false,
    disabled: false,
    resetKey: 0,
};

export default AIInputComposer;