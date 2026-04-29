import { outreachPrograms } from './staticOutreachContent';
import type { OutreachProvider } from './types';

export const outreachProvider: OutreachProvider = {
  async listPublicPrograms() {
    return outreachPrograms.map((item) => structuredClone(item));
  },
};
