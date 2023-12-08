import React, { useState, useEffect, useCallback } from 'react';
import { getAudioContext, initializeAudioOutput } from '@strudel.cycles/webaudio';
import { SelectInput } from './SelectInput';

const initdevices = new Map();
export function AudioDeviceSelector({ audioDeviceName, onChange }) {
  const [devices, setDevices] = useState(initdevices);
  const devicesInitialized = devices.size > 0;

  const setAudioDevice = useCallback(async (id) => {
    const audioCtx = getAudioContext();
    await audioCtx.setSinkId(id);
    initializeAudioOutput();
  });
  const initializedevices = useCallback(async () => {
    await navigator.mediaDevices.getUserMedia({ audio: true });
    let mediaDevices = await navigator.mediaDevices.enumerateDevices();
    mediaDevices = mediaDevices.filter((device) => device.kind === 'audiooutput' && device.deviceId !== 'default');
    const devicesMap = new Map();
    mediaDevices.forEach((device) => {
      devicesMap.set(device.label, device.deviceId);
    });
    setDevices(devicesMap);
    return devicesMap;
  }, []);

  useEffect(() => {
    if (!audioDeviceName.length || devicesInitialized) {
      return;
    }
    initializedevices().then((devices) => {
      const deviceID = devices.get(audioDeviceName);
      if (deviceID == null) {
        onChange('');
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
    deviceID && setAudioDevice(deviceID);
  };
  const options = new Map();
  Array.from(devices.keys()).forEach((deviceName) => {
    options.set(deviceName, deviceName);
  });
  return (
    <SelectInput
      options={options}
      onClick={onClick}
      placeholder="select device"
      value={audioDeviceName}
      onChange={onDeviceChange}
    />
  );
}
