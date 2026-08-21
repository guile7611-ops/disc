'use client';

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'selected_microphone_id';

export function useMicrophones() {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceIdState] = useState<string>('');
  const [hasPermission, setHasPermission] = useState<boolean>(false);

  const refreshDevices = useCallback(async () => {
    if (typeof window === 'undefined' || !navigator.mediaDevices) return;

    try {
      let deviceList = await navigator.mediaDevices.enumerateDevices();
      let audioInputs = deviceList.filter((d) => d.kind === 'audioinput');

      // Se os rótulos (labels) dos microfones estiverem vazios, solicita permissão temporária
      const hasLabels = audioInputs.some((d) => d.label !== '');
      if (!hasLabels && audioInputs.length > 0) {
        try {
          const tempStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          tempStream.getTracks().forEach((t) => t.stop());
          setHasPermission(true);
          deviceList = await navigator.mediaDevices.enumerateDevices();
          audioInputs = deviceList.filter((d) => d.kind === 'audioinput');
        } catch (permErr) {
          console.warn('Permissão de áudio não concedida para listar nomes dos microfones:', permErr);
        }
      } else if (hasLabels) {
        setHasPermission(true);
      }

      setDevices(audioInputs);

      // Carrega o microfone salvo anteriormente ou usa o padrão
      const savedId = localStorage.getItem(STORAGE_KEY);
      if (savedId && audioInputs.some((d) => d.deviceId === savedId)) {
        setSelectedDeviceIdState(savedId);
      } else if (audioInputs.length > 0) {
        const defaultDevice = audioInputs.find((d) => d.deviceId === 'default') || audioInputs[0];
        setSelectedDeviceIdState(defaultDevice.deviceId);
        localStorage.setItem(STORAGE_KEY, defaultDevice.deviceId);
      }
    } catch (err) {
      console.error('Erro ao enumerar microfones:', err);
    }
  }, []);

  const setSelectedDeviceId = useCallback((deviceId: string) => {
    setSelectedDeviceIdState(deviceId);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, deviceId);
    }
  }, []);

  useEffect(() => {
    refreshDevices();

    if (typeof window !== 'undefined' && navigator.mediaDevices) {
      const handleDeviceChange = () => {
        refreshDevices();
      };

      navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
      return () => {
        navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
      };
    }
  }, [refreshDevices]);

  return {
    devices,
    selectedDeviceId,
    setSelectedDeviceId,
    refreshDevices,
    hasPermission,
  };
}
