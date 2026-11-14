import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { MicFill, StopFill } from 'react-bootstrap-icons';
import { toast } from 'react-toastify';
import { audioTranscriptionApi } from '../../services/api/audioTranscriptionApi';
import styles from './VoiceTranscriber.module.scss';

const MAX_AUDIO_BYTES = 2 * 1024 * 1024;
const MAX_RECORDING_DURATION_MS = 60 * 1000;
const RECORDING_MIME_TYPES = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
];

async function prepareAudio(blob) {
    if (!blob.size) {
        throw new Error('No audio was captured. Please try recording again.');
    }
    if (blob.size > MAX_AUDIO_BYTES) {
        throw new Error('This recording is too large. Keep it under 2 MB and try again.');
    }

    const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Could not read the audio recording. Try again.'));
        reader.readAsDataURL(blob);
    });

    return {
        data: dataUrl.split(',')[1],
        mimeType: (blob.type || 'audio/webm').split(';')[0],
    };
}

function VoiceTranscriber({ disabled, onTranscript, onStateChange }) {
    const [recording, setRecording] = useState(false);
    const [startingRecording, setStartingRecording] = useState(false);
    const [transcribing, setTranscribing] = useState(false);
    const recorderRef = useRef(null);
    const streamRef = useRef(null);
    const chunksRef = useRef([]);
    const stopTimerRef = useRef(null);
    const discardRecordingRef = useRef(false);
    const recordingRequestRef = useRef(0);
    const mountedRef = useRef(true);

    useEffect(() => {
        onStateChange(recording || startingRecording || transcribing
            ? (recording ? 'Recording… tap stop when finished (maximum 60 seconds).'
                : startingRecording ? 'Waiting for microphone access…' : 'Transcribing audio…')
            : '');
    }, [recording, startingRecording, transcribing, onStateChange]);

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
            recordingRequestRef.current += 1;
            if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
            discardRecordingRef.current = true;
            if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
            streamRef.current?.getTracks().forEach((track) => track.stop());
        };
    }, []);

    const stopRecording = () => {
        if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
        if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
    };

    const startRecording = async () => {
        if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
            toast.error('Audio recording is not supported in this browser.');
            return;
        }

        const requestId = ++recordingRequestRef.current;
        setStartingRecording(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            if (!mountedRef.current || requestId !== recordingRequestRef.current) {
                stream.getTracks().forEach((track) => track.stop());
                return;
            }

            streamRef.current = stream;
            const mimeType = RECORDING_MIME_TYPES.find((type) => MediaRecorder.isTypeSupported(type));
            const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
            recorderRef.current = recorder;
            chunksRef.current = [];
            discardRecordingRef.current = false;

            recorder.ondataavailable = (event) => {
                if (event.data.size) chunksRef.current.push(event.data);
            };
            recorder.onerror = () => {
                discardRecordingRef.current = true;
                toast.error('Audio recording failed. Please try again.');
                stopRecording();
            };
            recorder.onstop = async () => {
                stream.getTracks().forEach((track) => track.stop());
                streamRef.current = null;
                if (mountedRef.current) setRecording(false);
                if (discardRecordingRef.current) return;

                if (mountedRef.current) setTranscribing(true);
                try {
                    const audio = await prepareAudio(new Blob(chunksRef.current, { type: recorder.mimeType }));
                    const response = await audioTranscriptionApi.transcribe(audio);
                    if (!response.success) {
                        throw new Error(response.error || 'Could not transcribe this audio.');
                    }
                    const transcript = response.data?.transcript;
                    if (typeof transcript !== 'string' || !transcript.trim()) {
                        throw new Error('No speech was recognized. Try recording again.');
                    }
                    if (mountedRef.current) {
                        onTranscript(transcript.trim());
                    }
                } catch (error) {
                    if (mountedRef.current) toast.error(error.message || 'Could not transcribe this audio.');
                } finally {
                    if (mountedRef.current) setTranscribing(false);
                }
            };

            recorder.start();
            setRecording(true);
            stopTimerRef.current = setTimeout(stopRecording, MAX_RECORDING_DURATION_MS);
        } catch (error) {
            streamRef.current?.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
            if (mountedRef.current && requestId === recordingRequestRef.current) {
                toast.error(error.name === 'NotAllowedError'
                    ? 'Allow microphone access in your browser to record audio.'
                    : error.message || 'Could not start audio recording.');
            }
        } finally {
            if (mountedRef.current && requestId === recordingRequestRef.current) {
                setStartingRecording(false);
            }
        }
    };

    return (
        <button
            type="button"
            className={`${styles.voiceButton} ${recording ? styles.recordingButton : ''}`}
            disabled={disabled || startingRecording || transcribing}
            onClick={recording ? stopRecording : startRecording}
            title={recording ? 'Stop recording' : 'Record transaction details'}
            aria-label={recording ? 'Stop recording' : 'Record transaction details'}
        >
            {recording ? <StopFill size={16} /> : <MicFill size={16} />}
        </button>
    );
}

VoiceTranscriber.propTypes = {
    disabled: PropTypes.bool,
    onTranscript: PropTypes.func.isRequired,
    onStateChange: PropTypes.func.isRequired,
};

VoiceTranscriber.defaultProps = {
    disabled: false,
};

export default VoiceTranscriber;
