import { Channel, SettingsConfig, Stagebox } from '../types';

const getDefaultPageSize = (): 'letter' | 'a4' => {
  try {
    const locale = (typeof navigator !== 'undefined' && navigator.language || '').toLowerCase();
    if (locale === 'en-us' || locale.endsWith('-us') || locale.endsWith('-ca') || locale.endsWith('-ph') || locale.endsWith('-co') || locale.endsWith('-cl')) {
      return 'letter';
    }
  } catch (e) {}
  return 'a4';
};

export const defaultUserSettings: import('../types').UserSettings = {
  confirmSubsnakeOverwrite: true,
  animationsEnabled: true,
};

export const defaultSettings: SettingsConfig = {
  palette: 'qu5',
  fontSizes: { number: 1, name: 1, metadata: 1, group: 1, subSnakeBadge: 1 },
  printHeight: 100,
  useEditorLookInPrint: true,
  colorOpacity: 0.25,
  xlrOpacity: 0.03,
  groupBorderOpacity: 1,
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

export const createEmptyInputs = (count: number): Channel[] => 
  Array.from({ length: count }, (_, i) => ({
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

export const createEmptyOutputs = (count: number): Channel[] => 
  Array.from({ length: count }, (_, i) => ({
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

export const initialInputs: Channel[] = createEmptyInputs(24);
export const initialOutputs: Channel[] = createEmptyOutputs(12);

export const initialStageboxes: Stagebox[] = [
  {
    id: 'local-io',
    name: 'Main IO',
    order: 0,
    grid: {
      input: { rows: 3, cols: 8 },
      output: { rows: 3, cols: 4 }
    }
  }
];

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

export interface StageboxPreset {
  id: string;
  name: string;
  inRows: number;
  inCols: number;
  outRows: number;
  outCols: number;
  inEnabled: boolean;
  outEnabled: boolean;
}

export interface StageboxPresetGroup {
  groupName: string;
  presets: StageboxPreset[];
}

export const STAGEBOX_PRESETS: StageboxPresetGroup[] = [
  {
    groupName: 'Common Generic Sizes',
    presets: [
      { id: 'custom', name: 'Custom', inRows: 0, inCols: 0, outRows: 0, outCols: 0, inEnabled: true, outEnabled: true },
      { id: '8x4', name: '8×4 (8 In / 4 Out)', inRows: 1, inCols: 8, outRows: 1, outCols: 4, inEnabled: true, outEnabled: true },
      { id: '16x8', name: '16×8 (16 In / 8 Out)', inRows: 2, inCols: 8, outRows: 2, outCols: 4, inEnabled: true, outEnabled: true },
      { id: '24x12', name: '24×12 (24 In / 12 Out)', inRows: 3, inCols: 8, outRows: 3, outCols: 4, inEnabled: true, outEnabled: true },
      { id: '32x16', name: '32×16 (32 In / 16 Out)', inRows: 4, inCols: 8, outRows: 4, outCols: 4, inEnabled: true, outEnabled: true },
      { id: '48x16', name: '48×16 (48 In / 16 Out)', inRows: 6, inCols: 8, outRows: 4, outCols: 4, inEnabled: true, outEnabled: true },
    ]
  },
  {
    groupName: 'Allen & Heath',
    presets: [
      { id: 'ah_ar84', name: 'AR84 (8 In / 4 Out)', inRows: 1, inCols: 8, outRows: 1, outCols: 4, inEnabled: true, outEnabled: true },
      { id: 'ah_ab168', name: 'AB168 / DX168 (16 In / 8 Out)', inRows: 2, inCols: 8, outRows: 2, outCols: 4, inEnabled: true, outEnabled: true },
      { id: 'ah_ar2412', name: 'AR2412 (24 In / 12 Out)', inRows: 3, inCols: 8, outRows: 3, outCols: 4, inEnabled: true, outEnabled: true },
      { id: 'ah_gx4816', name: 'GX4816 (48 In / 16 Out)', inRows: 6, inCols: 8, outRows: 4, outCols: 4, inEnabled: true, outEnabled: true },
      { id: 'ah_dx012', name: 'DX012 (0 In / 12 Out)', inRows: 0, inCols: 0, outRows: 3, outCols: 4, inEnabled: false, outEnabled: true },
    ]
  },
  {
    groupName: 'Avid',
    presets: [
      { id: 'avid_stage16', name: 'Stage 16 (16 In / 8 Out)', inRows: 2, inCols: 8, outRows: 2, outCols: 4, inEnabled: true, outEnabled: true },
      { id: 'avid_local16', name: 'VENUE | Local 16 (16 In / 8 Out)', inRows: 2, inCols: 8, outRows: 2, outCols: 4, inEnabled: true, outEnabled: true },
    ]
  },
  {
    groupName: 'Behringer / Midas (X/M Series)',
    presets: [
      { id: 'b_sd8', name: 'SD8 (8 In / 8 Out)', inRows: 1, inCols: 8, outRows: 2, outCols: 4, inEnabled: true, outEnabled: true },
      { id: 'b_s16', name: 'S16 / DL16 (16 In / 8 Out)', inRows: 2, inCols: 8, outRows: 2, outCols: 4, inEnabled: true, outEnabled: true },
      { id: 'b_s32', name: 'S32 / DL32 (32 In / 16 Out)', inRows: 4, inCols: 8, outRows: 4, outCols: 4, inEnabled: true, outEnabled: true },
    ]
  },
  {
    groupName: 'DiGiCo',
    presets: [
      { id: 'digico_drack', name: 'D-Rack (32 In / 8 Out)', inRows: 4, inCols: 8, outRows: 2, outCols: 4, inEnabled: true, outEnabled: true },
      { id: 'digico_d2rack', name: 'D2-Rack (48 In / 16 Out)', inRows: 6, inCols: 8, outRows: 4, outCols: 4, inEnabled: true, outEnabled: true },
      { id: 'digico_mqrack', name: 'MQ-Rack (48 In / 24 Out)', inRows: 6, inCols: 8, outRows: 6, outCols: 4, inEnabled: true, outEnabled: true },
    ]
  },
  {
    groupName: 'Midas (PRO Series)',
    presets: [
      { id: 'midas_dl251', name: 'DL251 (48 In / 16 Out)', inRows: 6, inCols: 8, outRows: 4, outCols: 4, inEnabled: true, outEnabled: true },
      { id: 'midas_dl252', name: 'DL252 (16 In / 48 Out)', inRows: 2, inCols: 8, outRows: 12, outCols: 4, inEnabled: true, outEnabled: true },
    ]
  },
  {
    groupName: 'PreSonus (StudioLive)',
    presets: [
      { id: 'pre_nsb168', name: 'NSB 16.8 (16 In / 8 Out)', inRows: 2, inCols: 8, outRows: 2, outCols: 4, inEnabled: true, outEnabled: true },
      { id: 'pre_nsb3216', name: 'NSB 32.16 (32 In / 16 Out)', inRows: 4, inCols: 8, outRows: 4, outCols: 4, inEnabled: true, outEnabled: true },
    ]
  },
  {
    groupName: 'Roland (REAC)',
    presets: [
      { id: 'roland_s1608', name: 'S-1608 (16 In / 8 Out)', inRows: 2, inCols: 8, outRows: 2, outCols: 4, inEnabled: true, outEnabled: true },
      { id: 'roland_s2416', name: 'S-2416 (24 In / 16 Out)', inRows: 3, inCols: 8, outRows: 4, outCols: 4, inEnabled: true, outEnabled: true },
    ]
  },
  {
    groupName: 'Soundcraft',
    presets: [
      { id: 'sc_mini16r', name: 'Mini Stagebox 16R (16 In / 8 Out)', inRows: 2, inCols: 8, outRows: 2, outCols: 4, inEnabled: true, outEnabled: true },
      { id: 'sc_mini32r', name: 'Mini Stagebox 32R (32 In / 16 Out)', inRows: 4, inCols: 8, outRows: 4, outCols: 4, inEnabled: true, outEnabled: true },
    ]
  },
  {
    groupName: 'Waves',
    presets: [
      { id: 'waves_1000', name: 'StageGrid 1000 (8 In / 4 Out)', inRows: 1, inCols: 8, outRows: 1, outCols: 4, inEnabled: true, outEnabled: true },
      { id: 'waves_4000', name: 'StageGrid 4000 (32 In / 16 Out)', inRows: 4, inCols: 8, outRows: 4, outCols: 4, inEnabled: true, outEnabled: true },
    ]
  },
  {
    groupName: 'Yamaha',
    presets: [
      { id: 'yamaha_1608', name: 'Tio1608-D / Rio1608-D2 (16 In / 8 Out)', inRows: 2, inCols: 8, outRows: 2, outCols: 4, inEnabled: true, outEnabled: true },
      { id: 'yamaha_3224', name: 'Rio3224-D2 (32 In / 24 Out)', inRows: 4, inCols: 8, outRows: 6, outCols: 4, inEnabled: true, outEnabled: true },
    ]
  }
];
