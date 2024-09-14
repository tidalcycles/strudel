import { defaultSettings, settingsMap, useSettings } from '../../../settings.mjs';
import { themes } from '@strudel/codemirror';
import { isUdels } from '../../util.mjs';
import { ButtonGroup } from './Forms.jsx';
import { AudioDeviceSelector } from './AudioDeviceSelector.jsx';
import { AudioEngineTargetSelector } from './AudioEngineTargetSelector.jsx';
import { confirmDialog } from '../../util.mjs';

function Checkbox({ label, value, onChange, disabled = false }) {
  return (
    <label>
      <input disabled={disabled} type="checkbox" checked={value} onChange={onChange} />
      {' ' + label}
    </label>
  );
}

function SelectInput({ value, options, onChange }) {
  return (
    <select
      className="p-2 bg-background rounded-md text-foreground"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {Object.entries(options).map(([k, label]) => (
        <option key={k} className="bg-background" value={k}>
          {label}
        </option>
      ))}
    </select>
  );
}

function NumberSlider({ value, onChange, step = 1, ...rest }) {
  return (
    <div className="flex space-x-2 gap-1">
      <input
        className="p-2 grow"
        type="range"
        value={value}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        {...rest}
      />
      <input
        type="number"
        value={value}
        step={step}
        className="w-16 bg-background rounded-md"
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

function FormItem({ label, children }) {
  return (
    <div className="grid gap-2">
      <label>{label}</label>
      {children}
    </div>
  );
}

const themeOptions = Object.fromEntries(Object.keys(themes).map((k) => [k, k]));
const fontFamilyOptions = {
  monospace: 'monospace',
  Courier: 'Courier',
  JetBrains: 'JetBrains',
  Hack: 'Hack',
  FiraCode: 'FiraCode',
  'FiraCode-SemiBold': 'FiraCode SemiBold',
  teletext: 'teletext',
  mode7: 'mode7',
  BigBlueTerminal: 'BigBlueTerminal',
  x3270: 'x3270',
  Monocraft: 'Monocraft',
  PressStart: 'PressStart2P',
  'we-come-in-peace': 'we-come-in-peace',
  galactico: 'galactico',
};

const RELOAD_MSG = 'Changing this setting requires the window to reload itself. OK?';

export function SettingsTab({ started }) {
  const {
    theme,
    keybindings,
    isBracketClosingEnabled,
    isBracketMatchingEnabled,
    isLineNumbersDisplayed,
    isPatternHighlightingEnabled,
    isActiveLineHighlighted,
    isAutoCompletionEnabled,
    isTooltipEnabled,
    isFlashEnabled,
    isSyncEnabled,
    isLineWrappingEnabled,
    fontSize,
    fontFamily,
    panelPosition,
    audioDeviceName,
    audioEngineTarget,
  } = useSettings();
  const shouldAlwaysSync = isUdels();
  const canChangeAudioDevice = AudioContext.prototype.setSinkId != null;
  return (
    <div className="text-foreground p-4 space-y-4">
      {canChangeAudioDevice && (
        <FormItem label="Audio Output Device">
          <AudioDeviceSelector
            isDisabled={started}
            audioDeviceName={audioDeviceName}
            onChange={(audioDeviceName) => {
              confirmDialog(RELOAD_MSG).then((r) => {
                if (r == true) {
                  settingsMap.setKey('audioDeviceName', audioDeviceName);
                  return window.location.reload();
                }
              });
            }}
          />
        </FormItem>
      )}
      <FormItem label="Audio Engine Target">
        <AudioEngineTargetSelector
          target={audioEngineTarget}
          onChange={(target) => {
            confirmDialog(RELOAD_MSG).then((r) => {
              if (r == true) {
                settingsMap.setKey('audioEngineTarget', target);
                return window.location.reload();
              }
            });
          }}
        />
      </FormItem>
      <FormItem label="Theme">
        <SelectInput options={themeOptions} value={theme} onChange={(theme) => settingsMap.setKey('theme', theme)} />
      </FormItem>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormItem label="Font Family">
          <SelectInput
            options={fontFamilyOptions}
            value={fontFamily}
            onChange={(fontFamily) => settingsMap.setKey('fontFamily', fontFamily)}
          />
        </FormItem>
        <FormItem label="Font Size">
          <NumberSlider
            value={fontSize}
            onChange={(fontSize) => settingsMap.setKey('fontSize', fontSize)}
            min={10}
            max={40}
            step={2}
          />
        </FormItem>
      </div>
      <FormItem label="Keybindings">
        <ButtonGroup
          value={keybindings}
          onChange={(keybindings) => settingsMap.setKey('keybindings', keybindings)}
          items={{ codemirror: 'Codemirror', vim: 'Vim', emacs: 'Emacs', vscode: 'VSCode' }}
        ></ButtonGroup>
      </FormItem>
      <FormItem label="Panel Position">
        <ButtonGroup
          value={panelPosition}
          onChange={(value) => settingsMap.setKey('panelPosition', value)}
          items={{ bottom: 'Bottom', right: 'Right' }}
        ></ButtonGroup>
      </FormItem>
      <FormItem label="Code Settings">
        <Checkbox
          label="Enable bracket matching"
          onChange={(cbEvent) => settingsMap.setKey('isBracketMatchingEnabled', cbEvent.target.checked)}
          value={isBracketMatchingEnabled}
        />
        <Checkbox
          label="Auto close brackets"
          onChange={(cbEvent) => settingsMap.setKey('isBracketClosingEnabled', cbEvent.target.checked)}
          value={isBracketClosingEnabled}
        />
        <Checkbox
          label="Display line numbers"
          onChange={(cbEvent) => settingsMap.setKey('isLineNumbersDisplayed', cbEvent.target.checked)}
          value={isLineNumbersDisplayed}
        />
        <Checkbox
          label="Highlight active line"
          onChange={(cbEvent) => settingsMap.setKey('isActiveLineHighlighted', cbEvent.target.checked)}
          value={isActiveLineHighlighted}
        />
        <Checkbox
          label="Highlight events in code"
          onChange={(cbEvent) => settingsMap.setKey('isPatternHighlightingEnabled', cbEvent.target.checked)}
          value={isPatternHighlightingEnabled}
        />
        <Checkbox
          label="Enable auto-completion"
          onChange={(cbEvent) => settingsMap.setKey('isAutoCompletionEnabled', cbEvent.target.checked)}
          value={isAutoCompletionEnabled}
        />
        <Checkbox
          label="Enable tooltips on Ctrl and hover"
          onChange={(cbEvent) => settingsMap.setKey('isTooltipEnabled', cbEvent.target.checked)}
          value={isTooltipEnabled}
        />
        <Checkbox
          label="Enable line wrapping"
          onChange={(cbEvent) => settingsMap.setKey('isLineWrappingEnabled', cbEvent.target.checked)}
          value={isLineWrappingEnabled}
        />
        <Checkbox
          label="Enable flashing on evaluation"
          onChange={(cbEvent) => settingsMap.setKey('isFlashEnabled', cbEvent.target.checked)}
          value={isFlashEnabled}
        />
        <Checkbox
          label="Sync across Browser Tabs / Windows"
          onChange={(cbEvent) => {
            const newVal = cbEvent.target.checked;
            confirmDialog(RELOAD_MSG).then((r) => {
              if (r) {
                settingsMap.setKey('isSyncEnabled', newVal);
                window.location.reload();
              }
            });
          }}
          disabled={shouldAlwaysSync}
          value={isSyncEnabled}
        />
      </FormItem>
      <FormItem label="Zen Mode">Try clicking the logo in the top left!</FormItem>
      <FormItem label="Reset Settings">
        <button
          className="bg-background p-2 max-w-[300px] rounded-md hover:opacity-50"
          onClick={() => {
            confirmDialog('Sure?').then((r) => {
              if (r) {
                settingsMap.set(defaultSettings);
              }
            });
          }}
        >
          restore default settings
        </button>
      </FormItem>
    </div>
  );
}
