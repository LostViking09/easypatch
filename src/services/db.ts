import Dexie, { Table } from 'dexie';
import { Channel, SettingsConfig, SubSnake } from '../types';

export interface Project {
  id: string;
  title: string;
  notes: string;
  settings: SettingsConfig;
  inputs: Channel[];
  outputs: Channel[];
  subSnakes: SubSnake[];
  updatedAt: number;
}

export class EasyPatchDB extends Dexie {
  projects!: Table<Project, string>;

  constructor() {
    super('EasyPatchDB');
    this.version(1).stores({
      projects: 'id, updatedAt' // Primary key is 'id'. We also index 'updatedAt' for sorting in the dashboard.
    });
  }
}

export const db = new EasyPatchDB();
