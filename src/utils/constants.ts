import { Channel, SettingsConfig } from '../types';

const getDefaultPageSize = (): 'letter' | 'a4' => {
  try {
    const locale = (typeof navigator !== 'undefined' && navigator.language || '').toLowerCase();
    if (locale === 'en-us' || locale.endsWith('-us') || locale.endsWith('-ca') || locale.endsWith('-ph') || locale.endsWith('-co') || locale.endsWith('-cl')) {
      return 'letter';
    }
  } catch (e) {}
  return 'a4';
};

export const defaultSettings: SettingsConfig = {
  palette: 'qu5',
  fontSizes: { number: 1, name: 1, metadata: 1, group: 1, subSnakeBadge: 1 },
  printHeight: 100,
  useEditorLookInPrint: true,
  colorOpacity: 0.25,
  xlrOpacity: 0.03,
  groupBorderOpacity: 1,
  confirmSubsnakeOverwrite: true,
  animationsEnabled: true,
  showGroupNameOnEveryCell: false,
  alwaysDrawCellBorders: true,
  includeSubSnakesInPrint: true,
  tableStripeOpacity: 0.05,
  tableHeaderOpacity: 0.08,
  printTheme: 'color',
  printPageSize: getDefaultPageSize(),
  printOrientation: 'landscape',
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
  mic: '',
  stand: '',
  notes: '',
  color: '#ffffff',
  group: '',
}));

export const initialOutputs: Channel[] = Array.from({ length: 12 }, (_, i) => ({
  id: `out-${i + 1}`,
  type: 'out',
  number: i + 1,
  name: '',
  mic: '',
  stand: '',
  notes: '',
  color: '#ffffff',
  group: '',
}));

export interface SubSnakePreset {
  name: string;
  value: string;
  in?: { rows: number; cols: number };
  out?: { rows: number; cols: number };
}

export const SUB_SNAKE_PRESETS: SubSnakePreset[] = [
  { name: 'Dynamic (Auto-size)', value: 'dynamic' },
  { name: '2×2 (4 ch)', value: '2x2', in: { rows: 2, cols: 2 }, out: { rows: 0, cols: 0 } },
  { name: '4×2 (8 ch)', value: '4x2', in: { rows: 2, cols: 4 }, out: { rows: 0, cols: 0 } },
  { name: '4×3 (12 ch)', value: '4x3', in: { rows: 3, cols: 4 }, out: { rows: 0, cols: 0 } },
  { name: '4×4 (16 ch)', value: '4x4', in: { rows: 4, cols: 4 }, out: { rows: 0, cols: 0 } },
  { name: 'Custom', value: 'custom', in: { rows: 2, cols: 4 }, out: { rows: 0, cols: 0 } },
];

