export type Channel = {
  id: string;
  type: 'in' | 'out';
  number: number;
  name: string;
  tech: string;
  color: string;
  group?: string;
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
  grid: {
    input: { rows: number; cols: number };
    output: { rows: number; cols: number };
  };
};
