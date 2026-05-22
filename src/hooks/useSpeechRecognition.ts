import { useRef, useState, useCallback, useEffect } from 'react';

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

export function useSpeechRecognition() {
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalRef = useRef('');

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
      setIsSupported(true);
      const rec = new SR();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';
      rec.maxAlternatives = 1;

      rec.onresult = (event: SpeechRecognitionEvent) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const text = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalRef.current += text + ' ';
            setTranscript(finalRef.current);
          } else {
            interim += text;
          }
        }
        setInterimTranscript(interim);
      };

      rec.onerror = (event: SpeechRecognitionErrorEvent) => {
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
          console.warn('Speech recognition error:', event.error);
        }
      };

      recognitionRef.current = rec;
    }
  }, []);

  const start = useCallback(() => {
    try { recognitionRef.current?.start(); } catch { /* already started */ }
  }, []);

  const pause = useCallback(() => {
    try { recognitionRef.current?.stop(); } catch { /* already stopped */ }
    setInterimTranscript('');
  }, []);

  const stop = useCallback(() => {
    try { recognitionRef.current?.stop(); } catch { /* already stopped */ }
    setInterimTranscript('');
  }, []);

  const reset = useCallback(() => {
    finalRef.current = '';
    setTranscript('');
    setInterimTranscript('');
  }, []);

  return { transcript, interimTranscript, isSupported, start, pause, stop, reset };
}
