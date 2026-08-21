'use client';

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'selected_speaker_id';

export function useSpeakers() {
  const [speakerDevices, setSpeakerDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedSpeakerId, setSelectedSpeakerIdState] = useState<string>('');

  const refreshSpeakers = useCallback(async () => {
    if (typeof window === 'undefined' || !navigator.mediaDevices) return;

    try {
      const deviceList = await navigator.mediaDevices.enumerateDevices();
      const audioOutputs = deviceList.filter((d) => d.kind === 'audiooutput');
      setSpeakerDevices(audioOutputs);

      const savedId = localStorage.getItem(STORAGE_KEY);
      if (savedId && audioOutputs.some((d) => d.deviceId === savedId)) {
        setSelectedSpeakerIdState(savedId);
      } else if (audioOutputs.length > 0) {
        const defaultDevice = audioOutputs.find((d) => d.deviceId === 'default') || audioOutputs[0];
        setSelectedSpeakerIdState(defaultDevice.deviceId);
        localStorage.setItem(STORAGE_KEY, defaultDevice.deviceId);
      }
    } catch (err) {
      console.error('Erro ao enumerar dispositivos de saída:', err);
    }
  }, []);

  const setSelectedSpeakerId = useCallback((deviceId: string) => {
    setSelectedSpeakerIdState(deviceId);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, deviceId);
    }
  }, []);

  useEffect(() => {
    refreshSpeakers();

    if (typeof window !== 'undefined' && navigator.mediaDevices) {
      const handleDeviceChange = () => {
        refreshSpeakers();
      };

      navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
      return () => {
        navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
      };
    }
  }, [refreshSpeakers]);

  return {
    speakerDevices,
    selectedSpeakerId,
    setSelectedSpeakerId,
    refreshSpeakers,
  };
}
