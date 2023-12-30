import React, { useState } from 'react';
import { getAudioContext, initializeAudioOutput } from '@strudel.cycles/webaudio';
import { SelectInput } from './SelectInput';
import { logger } from '@strudel.cycles/core';

const initdevices = new Map();
export const defaultAudioDeviceName = 'System Standard';

export const getAudioDevices = async () => {
  await navigator.mediaDevices.getUserMedia({ audio: true });
  let mediaDevices = await navigator.mediaDevices.enumerateDevices();
  mediaDevices = mediaDevices.filter((device) => device.kind === 'audiooutput' && device.deviceId !== 'default');
  const devicesMap = new Map();
  devicesMap.set(defaultAudioDeviceName, '');
  mediaDevices.forEach((device) => {
    devicesMap.set(device.label, device.deviceId);
  });
  return devicesMap;
};

export const setAudioDevice = async (id) => {
  const isValidID = (id ?? '').length > 0;
  // reset the audio context and dont set the sink id if it is invalid AKA System Standard selection
  const audioCtx = getAudioContext(!isValidID);
  if (isValidID) {
    try {
      await audioCtx.setSinkId(id);
    } catch {
      logger('failed to set audio interface', 'warning');
    }
  }
  initializeAudioOutput();
};

// Allows the user to select an audio interface for Strudel to play through
export function AudioDeviceSelector({ audioDeviceName, onChange }) {
  const [devices, setDevices] = useState(initdevices);
  const devicesInitialized = devices.size > 0;

  const onClick = () => {
    if (devicesInitialized) {
      return;
    }
    getAudioDevices().then((devices) => {
      setDevices(devices);
    });
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
  return <SelectInput options={options} onClick={onClick} value={audioDeviceName} onChange={onDeviceChange} />;
}
