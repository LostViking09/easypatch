export type Channel = {
  id: string;
  type: 'in' | 'out';
  number: number;
  name: string;
  tech: string;
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
    tech: number;
    group: number;
  };
  printHeight: number;
  useEditorLookInPrint: boolean;
  colorOpacity: number;
  xlrOpacity: number;
  groupBorderOpacity: number;
  confirmSubsnakeOverwrite?: boolean;
  grid: {
    input: { rows: number; cols: number };
    output: { rows: number; cols: number };
  };
};

