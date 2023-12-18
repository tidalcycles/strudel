import React, { useState, useEffect, useCallback } from 'react';
import { getAudioContext, initializeAudioOutput } from '@strudel.cycles/webaudio';
import { SelectInput } from './SelectInput';

const initdevices = new Map();
const defaultDeviceName = 'System Standard';
// Allows the user to select an audio interface for Strudel to play through
export function AudioDeviceSelector({ audioDeviceName, onChange }) {
  const [devices, setDevices] = useState(initdevices);
  const devicesInitialized = devices.size > 0;

  const setAudioDevice = useCallback(async (id) => {
    const isValidID = (id ?? '').length > 0;
    // reset the audio context and dont set the sink id if it is invalid AKA System Standard selection
    const audioCtx = getAudioContext(!isValidID);
    if (isValidID) {
      await audioCtx.setSinkId(id);
    }
    initializeAudioOutput();
  });
  const initializedevices = useCallback(async () => {
    await navigator.mediaDevices.getUserMedia({ audio: true });
    let mediaDevices = await navigator.mediaDevices.enumerateDevices();
    mediaDevices = mediaDevices.filter((device) => device.kind === 'audiooutput' && device.deviceId !== 'default');
    const devicesMap = new Map();
    devicesMap.set(defaultDeviceName, '');
    mediaDevices.forEach((device) => {
      devicesMap.set(device.label, device.deviceId);
    });
    setDevices(devicesMap);
    return devicesMap;
  }, []);

  // on first load, check if there is a cached audio device name in settings and initialize it
  useEffect(() => {
    if (!audioDeviceName.length || devicesInitialized) {
      return;
    }
    initializedevices().then((devices) => {
      const deviceID = devices.get(audioDeviceName);
      if (deviceID == null) {
        onChange(defaultDeviceName);
        return;
      }
      setAudioDevice(deviceID);
    });
  }, []);

  const onClick = () => {
    if (devicesInitialized) {
      return;
    }
    initializedevices();
  };
  const onDeviceChange = (deviceName) => {
    if (!devicesInitialized) {
      return;
    }
    const deviceID = devices.get(deviceName);
    onChange(deviceName);
    setAudioDevice(deviceID);
  };
  const options = new Map();
  Array.from(devices.keys()).forEach((deviceName) => {
    options.set(deviceName, deviceName);
  });
  return (
    <SelectInput
      options={options}
      onClick={onClick}
      placeholder={defaultDeviceName}
      value={audioDeviceName}
      onChange={onDeviceChange}
    />
  );
}
