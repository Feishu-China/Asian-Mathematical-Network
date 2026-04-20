import type {
  ConferenceEditorValues,
  ConferenceFormSchema,
  SupportedConferenceFieldKey,
} from './types';

export const participationTypeOptions = ['talk', 'poster', 'participant'];

const orderedFieldKeys: SupportedConferenceFieldKey[] = [
  'participation_type',
  'statement',
  'abstract_title',
  'abstract_text',
  'interested_in_travel_support',
];

export const buildConferenceFormSchema = (
  values: Pick<ConferenceEditorValues, 'includeAbstractFields' | 'includeTravelSupportQuestion'>
): ConferenceFormSchema => ({
  fields: orderedFieldKeys.flatMap((key) => {
    if (key === 'abstract_title' || key === 'abstract_text') {
      return values.includeAbstractFields
        ? [{ key, type: key === 'abstract_title' ? 'text' : 'textarea', required: false }]
        : [];
    }

    if (key === 'interested_in_travel_support') {
      return values.includeTravelSupportQuestion
        ? [{ key, type: 'checkbox', required: false }]
        : [];
    }

    if (key === 'participation_type') {
      return [{ key, type: 'select', required: true, options: participationTypeOptions }];
    }

    return [{ key, type: 'textarea', required: true }];
  }),
});

export const readConferenceFormToggles = (schema: ConferenceFormSchema) => ({
  includeAbstractFields: schema.fields.some((field) => field.key === 'abstract_title'),
  includeTravelSupportQuestion: schema.fields.some(
    (field) => field.key === 'interested_in_travel_support'
  ),
});
