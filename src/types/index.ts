export type Channel = {
  id: string;
  type: 'in' | 'out';
  number: number;
  name: string;
  mic: string;
  stand: string;
  notes: string;
  color: string;
  group?: string;
  stereoLink?: 'next' | 'prev';
  subSnakeId?: string;
  subSnakeChannel?: number;
  stageboxId?: string;
  stageboxPort?: number;
};

export type SubSnake = {
  id: string;
  name: string;
  note?: string;
  color: string;
  grid?: {
    input: { rows: number; cols: number };
    output: { rows: number; cols: number };
  };
};

export type Stagebox = {
  id: string;
  name: string;
  note?: string;
  order: number;
  grid: {
    input: { rows: number; cols: number };
    output: { rows: number; cols: number };
  };
};

export type UserSettings = {
  confirmSubsnakeOverwrite?: boolean;
  animationsEnabled?: boolean;
};

export type ProjectSettings = {
  palette: 'qu5' | 'sq';
  fontSizes: {
    number: number;
    name: number;
    metadata: number;
    group: number;
    subSnakeBadge: number;
  };
  printHeight: number;
  useEditorLookInPrint: boolean;
  colorOpacity: number;
  xlrOpacity: number;
  groupBorderOpacity: number;
  showGroupNameOnEveryCell?: boolean;
  alwaysDrawCellBorders?: boolean;
  includeSubSnakesInPrint?: boolean;
  printTheme: 'color' | 'bw';
  printPageSize: 'letter' | 'a4';
  printOrientation: 'landscape' | 'portrait';
  tableStripeOpacity?: number;
  tableHeaderOpacity?: number;
  grid: {
    input: { rows: number; cols: number };
    output: { rows: number; cols: number };
  };
};

export type SettingsConfig = ProjectSettings;

export interface PrintSourceOptions {
  printGrid: boolean;
  printTable: boolean;
}

export interface PrintOptions {
  mainInput: PrintSourceOptions;
  mainOutput: PrintSourceOptions;
  subSnakes: Record<string, PrintSourceOptions>;
}
