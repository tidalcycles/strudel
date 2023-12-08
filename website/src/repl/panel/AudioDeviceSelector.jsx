import React, { useState, useEffect } from 'react';
import { getAudioContext, initializeAudioOutput } from '@strudel.cycles/webaudio';
import { SelectInput } from './SelectInput';

async function setAudioDevice(id) {
  const audioCtx = getAudioContext();
  await audioCtx.setSinkId(id);
  await initializeAudioOutput();
}
export function AudioDeviceSelector({ audioDeviceName, onChange }) {
  const [options, setOptions] = useState({});
  const [optionsInitialized, setOptionsInitialized] = useState(false);

  async function initializeOptions() {
    await navigator.mediaDevices.getUserMedia({ audio: true });
    let devices = await navigator.mediaDevices.enumerateDevices();
    devices = devices.filter((device) => device.kind === 'audiooutput' && device.deviceId !== 'default');
    const optionsArray = [];
    devices.forEach((device) => {
      optionsArray.push([device.deviceId, device.label]);
    });
    const options = Object.fromEntries(optionsArray);
    setOptions(options);
    setOptionsInitialized(true);
    return options;
  }

  useEffect(() => {
    if (!audioDeviceName.length || optionsInitialized) {
      return;
    }

    (async () => {
      const options = await initializeOptions();

      const deviceID = Object.keys(options).find((id) => options[id] === audioDeviceName);

      if (deviceID == null) {
        onChange('');
        return;
      }

      await setAudioDevice(deviceID);
    })();
  }, []);

  const onClick = () => {
    if (optionsInitialized) {
      return;
    }
    (async () => {
      await initializeOptions();
    })();
  };
  const onDeviceChange = (deviceID) => {
    (async () => {
      const deviceName = options[deviceID];
      onChange(deviceName);
      await setAudioDevice(deviceID);
    })();
  };
  return (
    <SelectInput
      options={options}
      onClick={onClick}
      value={Object.keys(options).find((id) => options[id] === audioDeviceName)}
      onChange={onDeviceChange}
    />
  );
}
