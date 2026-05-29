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
};

export type SubSnake = {
  id: string;
  name: string;
  color: string;
  grid?: {
    input: { rows: number; cols: number };
    output: { rows: number; cols: number };
  };
};

export type SettingsConfig = {
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
  confirmSubsnakeOverwrite?: boolean;
  animationsEnabled?: boolean;
  showGroupNameOnEveryCell?: boolean;
  alwaysDrawCellBorders?: boolean;
  includeSubSnakesInPrint?: boolean;
  printTheme?: 'color' | 'bw';
  tableStripeOpacity?: number;
  tableHeaderOpacity?: number;
  grid: {
    input: { rows: number; cols: number };
    output: { rows: number; cols: number };
  };
};

export interface PrintSourceOptions {
  printGrid: boolean;
  printTable: boolean;
}

export interface PrintOptions {
  mainInput: PrintSourceOptions;
  mainOutput: PrintSourceOptions;
  subSnakes: Record<string, PrintSourceOptions>;
}
