import { shouldUseFakeProvider } from '../providerMode';
import { fetchScholarDirectory } from '../../api/profile';
import { scholarDirectorySeed, scholarExpertiseClusterSeed } from './directorySeed';
import { readEditablePublicScholarSummary } from './fakeProfileProvider';
import {
  fromTransportPublicScholarSummary,
  fromTransportScholarExpertiseCluster,
} from './profileMappers';

const clone = <T,>(value: T): T => structuredClone(value);

export const scholarDirectoryProvider = {
  async getDirectoryViewModel() {
    if (!shouldUseFakeProvider(import.meta.env)) {
      const response = await fetchScholarDirectory();
      return {
        scholars: response.data.scholars.map(fromTransportPublicScholarSummary),
        clusters: response.data.clusters.map(fromTransportScholarExpertiseCluster),
      };
    }

    const baseScholars = clone(scholarDirectorySeed);
    const baseClusters = clone(scholarExpertiseClusterSeed);

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
