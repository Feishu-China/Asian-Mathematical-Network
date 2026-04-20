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
  fields: orderedFieldKeys.reduce<ConferenceFormSchema['fields']>((fields, key) => {
    if (key === 'abstract_title' || key === 'abstract_text') {
      if (values.includeAbstractFields) {
        fields.push({
          key,
          type: key === 'abstract_title' ? 'text' : 'textarea',
          required: false,
        });
      }

      return fields;
    }

    if (key === 'interested_in_travel_support') {
      if (values.includeTravelSupportQuestion) {
        fields.push({ key, type: 'checkbox', required: false });
      }

      return fields;
    }

    if (key === 'participation_type') {
      fields.push({ key, type: 'select', required: true, options: participationTypeOptions });
      return fields;
    }

    fields.push({ key, type: 'textarea', required: true });
    return fields;
  }, []),
});

export const readConferenceFormToggles = (schema: ConferenceFormSchema) => ({
  includeAbstractFields: schema.fields.some((field) => field.key === 'abstract_title'),
  includeTravelSupportQuestion: schema.fields.some(
    (field) => field.key === 'interested_in_travel_support'
  ),
});
