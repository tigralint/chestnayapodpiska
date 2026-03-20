import { useState, useCallback, useRef, useEffect } from 'react';
import { LEVELS } from '../data/simulator-levels';
import { SIMULATOR_CONFIG } from '../constants/simulator';

export type FeedbackState = 'idle' | 'hit' | 'miss';

export function useSimulator() {
    const [currentLevelIdx, setCurrentLevelIdx] = useState(SIMULATOR_CONFIG.INITIAL_LEVEL_INDEX);
    const [currentStepIdx, setCurrentStepIdx] = useState(SIMULATOR_CONFIG.INITIAL_STEP_INDEX);
    const [feedback, setFeedback] = useState<FeedbackState>('idle');
    const [showResult, setShowResult] = useState(false);

    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Clean up any pending timer on unmount
    useEffect(() => {
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    const currentLevel = LEVELS[currentLevelIdx]!;
    const progress = (currentLevelIdx / LEVELS.length) * 100;

    const nextLevel = useCallback(() => {
        setFeedback('idle');
        setCurrentStepIdx(SIMULATOR_CONFIG.INITIAL_STEP_INDEX);
        if (currentLevelIdx < LEVELS.length - 1) {
            setCurrentLevelIdx(idx => idx + 1);
        } else {
            setShowResult(true);
        }
    }, [currentLevelIdx]);

    const handleHit = useCallback(() => {
        if (feedback !== 'idle') return;

        setFeedback('hit');

        timerRef.current = setTimeout(() => {
            if (currentLevel.maxSteps && currentStepIdx < currentLevel.maxSteps - 1) {
                setCurrentStepIdx(prevStep => prevStep + 1);
                setFeedback('idle');
            } else {
                nextLevel();
            }
        }, SIMULATOR_CONFIG.HIT_FEEDBACK_DURATION);
    }, [feedback, currentLevel, currentStepIdx, nextLevel]);

    const handleMiss = useCallback(() => {
        if (feedback !== 'idle') return;
        setFeedback('miss');
        timerRef.current = setTimeout(() => {
            nextLevel();
        }, SIMULATOR_CONFIG.MISS_FEEDBACK_DURATION);
    }, [feedback, nextLevel]);

    const reset = useCallback(() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        setCurrentLevelIdx(SIMULATOR_CONFIG.INITIAL_LEVEL_INDEX);
        setCurrentStepIdx(SIMULATOR_CONFIG.INITIAL_STEP_INDEX);
        setShowResult(false);
        setFeedback('idle');
    }, []);

    return {
        currentLevel,
        currentLevelIdx,
        currentStepIdx,
        feedback,
        showResult,
        progress,
        handleHit,
        handleMiss,
        reset,
        totalLevels: LEVELS.length
    };
}

