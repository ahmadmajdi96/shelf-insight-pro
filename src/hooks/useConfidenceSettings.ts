import { useState, useEffect, useCallback } from 'react';

const CONFIDENCE_STORAGE_KEY = 'detection_confidence_threshold';
const DEFAULT_CONFIDENCE = 0.95;

// Create a simple event system for cross-component updates
const confidenceListeners = new Set<(value: number) => void>();

export function useConfidenceSettings() {
  const [confidence, setConfidenceState] = useState<number>(() => {
    const stored = localStorage.getItem(CONFIDENCE_STORAGE_KEY);
    return stored ? parseFloat(stored) : DEFAULT_CONFIDENCE;
  });

  // Subscribe to changes from other components
  useEffect(() => {
    const listener = (value: number) => {
      setConfidenceState(value);
    };
    confidenceListeners.add(listener);
    return () => {
      confidenceListeners.delete(listener);
    };
  }, []);

  const setConfidence = useCallback((value: number) => {
    const clampedValue = Math.max(0.5, Math.min(1, value));
    localStorage.setItem(CONFIDENCE_STORAGE_KEY, clampedValue.toString());
    setConfidenceState(clampedValue);
    // Notify all other listeners
    confidenceListeners.forEach(listener => listener(clampedValue));
  }, []);

  return {
    confidence,
    setConfidence,
    confidencePercent: Math.round(confidence * 100),
  };
}
