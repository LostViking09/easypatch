import { Channel, SettingsConfig } from '../types';

export const defaultSettings: SettingsConfig = {
  palette: 'qu5',
  fontSizes: { number: 1, name: 1, tech: 1, group: 1 },
  printHeight: 100,
  useEditorLookInPrint: true,
  colorOpacity: 0.25,
  xlrOpacity: 0.03,
  groupBorderOpacity: 1,
  grid: {
    input: { rows: 3, cols: 8 },
    output: { rows: 3, cols: 4 },
  },
};

export const PALETTES = {
  qu5: [
    { label: 'White', value: '#ffffff' },
    { label: 'Yellow', value: '#e2b116' },
    { label: 'Red', value: '#c43932' },
    { label: 'Green', value: '#01d243' },
    { label: 'LightBlue', value: '#017fba' },
    { label: 'Blue', value: '#0934a5' },
    { label: 'Purple', value: '#4c06be' },
    { label: 'Pink', value: '#fe4adf' },
  ],
  sq: [
    { label: 'White', value: '#ffffff' },
    { label: 'Yellow', value: '#ffff00' },
    { label: 'Red', value: '#fe0000' },
    { label: 'Green', value: '#00ff01' },
    { label: 'LightBlue', value: '#0debff' },
    { label: 'Blue', value: '#0a00ff' },
    { label: 'Pink', value: '#ff00fe' },
    { label: 'Black', value: '#000000' },
  ]
};

export const initialInputs: Channel[] = Array.from({ length: 24 }, (_, i) => ({
  id: `in-${i + 1}`,
  type: 'in',
  number: i + 1,
  name: '',
  tech: '',
  color: '#ffffff',
  group: '',
}));

export const initialOutputs: Channel[] = Array.from({ length: 12 }, (_, i) => ({
  id: `out-${i + 1}`,
  type: 'out',
  number: i + 1,
  name: '',
  tech: '',
  color: '#ffffff',
  group: '',
}));
