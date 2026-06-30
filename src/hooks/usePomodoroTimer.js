import { useState, useEffect, useRef, useCallback } from 'react';

const MODES = {
  work: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
};

const CYCLE_ORDER = ['work', 'shortBreak', 'longBreak'];

export function usePomodoroTimer() {
  const [currentMode, setCurrentMode] = useState('work');
  const [timeRemaining, setTimeRemaining] = useState(MODES.work);
  const [isRunning, setIsRunning] = useState(false);
  
  const endTimeRef = useRef(null);

  const updateTimer = useCallback(() => {
    if (!isRunning || !endTimeRef.current) return;
    
    const now = Date.now();
    const remainingMs = endTimeRef.current - now;
    
    if (remainingMs <= 0) {
      setTimeRemaining(0);
      setIsRunning(false);
      endTimeRef.current = null;
    } else {
      setTimeRemaining(Math.ceil(remainingMs / 1000));
    }
  }, [isRunning]);

  useEffect(() => {
    let intervalId;
    if (isRunning) {
      // Run interval every 200ms to keep UI responsive and catch accurate seconds
      intervalId = setInterval(updateTimer, 200);
    }
    return () => clearInterval(intervalId);
  }, [isRunning, updateTimer]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      // Sync timer if tab becomes visible again
      if (document.visibilityState === 'visible') {
        updateTimer();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [updateTimer]);

  const start = useCallback(() => {
    if (!isRunning && timeRemaining > 0) {
      endTimeRef.current = Date.now() + timeRemaining * 1000;
      setIsRunning(true);
    }
  }, [isRunning, timeRemaining]);

  const pause = useCallback(() => {
    if (isRunning) {
      setIsRunning(false);
      if (endTimeRef.current) {
        const remainingMs = endTimeRef.current - Date.now();
        const remainingSecs = Math.max(0, Math.ceil(remainingMs / 1000));
        setTimeRemaining(remainingSecs);
      }
      endTimeRef.current = null;
    }
  }, [isRunning]);

  const reset = useCallback(() => {
    setIsRunning(false);
    endTimeRef.current = null;
    setTimeRemaining(MODES[currentMode]);
  }, [currentMode]);

  const skipToNext = useCallback(() => {
    setIsRunning(false);
    endTimeRef.current = null;
    
    const currentIndex = CYCLE_ORDER.indexOf(currentMode);
    const nextMode = CYCLE_ORDER[(currentIndex + 1) % CYCLE_ORDER.length];
    
    setCurrentMode(nextMode);
    setTimeRemaining(MODES[nextMode]);
  }, [currentMode]);

  return {
    timeRemaining,
    currentMode,
    isRunning,
    start,
    pause,
    reset,
    skipToNext
  };
}
