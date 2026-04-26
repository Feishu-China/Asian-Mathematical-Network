import { shouldUseFakeProvider } from '../providerMode';
import { scholarDirectorySeed, scholarExpertiseClusterSeed } from './directorySeed';
import { readEditablePublicScholarSummary } from './fakeProfileProvider';

const clone = <T,>(value: T): T => structuredClone(value);

export const scholarDirectoryProvider = {
  async getDirectoryViewModel() {
    const baseScholars = clone(scholarDirectorySeed);
    const baseClusters = clone(scholarExpertiseClusterSeed);

    if (!shouldUseFakeProvider(import.meta.env)) {
      return {
        clusters: baseClusters,
        scholars: baseScholars,
      };
    }

    const editableProfile = readEditablePublicScholarSummary();
    const scholars = editableProfile
      ? [editableProfile, ...baseScholars.filter((item) => item.slug !== editableProfile.slug)]
      : baseScholars;

    return {
      clusters: baseClusters,
      scholars,
    };
  },
};
