export type Placement = 'top' | 'bottom' | 'left' | 'right' | 'center';

export interface WalkthroughShortcut {
  keys: string[];
  description: string;
}

export interface WalkthroughStep {
  target: string; // The data-tour attribute value
  title: string;
  content: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  actionEvent?: string;
  actionLabel?: string;
  exploreOption?: string;
  requiredLayout?: 'grid' | 'table';
  requiredView?: 'main' | string;
  shortcuts?: WalkthroughShortcut[];
}

export const WALKTHROUGH_STEPS: WalkthroughStep[] = [
  {
    target: 'patch-grid',
    title: 'Your StagePatch Grid',
    content: 'Welcome! This is your main workspace. Channels are visually arranged here. Click on any channel cell to open its editor.',
    placement: 'bottom',
    actionEvent: 'open-edit-modal',
    actionLabel: 'Click on any channel cell',
    requiredLayout: 'grid',
    requiredView: 'main'
  },
  {
    target: 'edit-modal',
    title: 'Editing Channels',
    content: 'Here you can name the channel, assign a color, or route it to a subsnake. Close this window to continue the tour.',
    placement: 'right',
    actionEvent: 'close-edit-modal',
    actionLabel: 'Close the channel editor window',
    requiredLayout: 'grid',
    requiredView: 'main',
    shortcuts: [
      { keys: ['Ctrl', '→'], description: 'Save & Next Channel' },
      { keys: ['Ctrl', 'Shift', '←'], description: 'Save & Prev Channel' },
      { keys: ['Esc'], description: 'Close without saving' },
      { keys: ['Enter'], description: 'Save & Close' }
    ]
  },
  {
    target: 'stageboxes-btn',
    title: 'Hardware Layout',
    content: 'Need to match physical hardware? Configure Stageboxes here to split your grid into discrete hardware racks.',
    exploreOption: 'Feel free to explore, or click Next to continue the tour.',
    placement: 'bottom',
    requiredLayout: 'grid',
    requiredView: 'main'
  },
  {
    target: 'subsnakes-btn',
    title: 'Manage SubSnakes',
    content: 'Create subsnakes (like a Drum Drop or Stage Left box) here. You can then assign any channel to them.',
    exploreOption: 'Feel free to explore, or click Next to continue.',
    placement: 'bottom',
    requiredLayout: 'grid',
    requiredView: 'main'
  },
  {
    target: 'multi-select-btn',
    title: 'Mass Assignment',
    content: 'Have 8 drum channels to color code? Click here to enable Multi-Select mode and edit multiple channels at once.',
    placement: 'bottom',
    requiredLayout: 'grid',
    requiredView: 'main'
  },
  {
    target: 'view-switcher',
    title: 'Switching Views',
    content: 'Sometimes a spreadsheet is better. Click the Table icon to switch your layout to Table View.',
    placement: 'bottom',
    actionEvent: 'switch-table-view',
    actionLabel: 'Click the [Table] button',
    requiredLayout: 'grid',
    requiredView: 'main'
  },
  {
    target: 'table-view',
    title: 'Inline Editing',
    content: 'Welcome to Table View! Here you can click directly on any text (like Name, Mic, or Notes) to edit it inline.',
    placement: 'top',
    requiredLayout: 'table',
    requiredView: 'main',
    shortcuts: [
      { keys: ['Tab'], description: 'Next field' },
      { keys: ['Shift', 'Tab'], description: 'Previous field' },
      { keys: ['Enter'], description: 'Next row' },
      { keys: ['Shift', 'Enter'], description: 'Previous row' }
    ]
  },
  {
    target: 'print-btn',
    title: 'Export & Print',
    content: 'Ready for the show? Click here to print your patch list or save it as a PDF.',
    placement: 'bottom',
    requiredLayout: 'table',
    requiredView: 'main'
  }
];
