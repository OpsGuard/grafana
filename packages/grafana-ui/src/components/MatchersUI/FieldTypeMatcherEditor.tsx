import React, { memo, useMemo, useCallback } from 'react';
import { MatcherUIProps, FieldMatcherUIRegistryItem } from './types';
import { FieldMatcherID, fieldMatchers, SelectableValue, FieldType, DataFrame } from '@grafana/data';
import { Select } from '../Select/Select';

export const FieldTypeMatcherEditor = memo<MatcherUIProps<string>>(props => {
  const { data, options } = props;
  const counts = useFieldCounts(data);
  const selectOptions = useSelectOptions(counts, options);

  const onChange = useCallback(
    (selection: SelectableValue<string>) => {
      return props.onChange(selection.value!);
    },
    [counts, props.onChange]
  );

  const selectedOption = selectOptions.find(v => v.value === options);
  return <Select value={selectedOption} options={selectOptions} onChange={onChange} />;
});

const allTypes: Array<SelectableValue<string>> = [
  { value: FieldType.number, label: 'Numeric fields' },
  { value: FieldType.string, label: 'String fields' },
  { value: FieldType.time, label: 'Time fields' },
  { value: FieldType.boolean, label: 'Boolean fields' },
  { value: FieldType.trace, label: 'Trace fields' },
  { value: FieldType.other, label: 'Other fields' },
  { value: '*', label: 'Any field type' },
];

const useFieldCounts = (data: DataFrame[]): Map<string, number> => {
  return useMemo(() => {
    const counts: Map<string, number> = new Map();
    for (const t of allTypes) {
      counts.set(t.value!, 0);
    }

    let total = 0;
    for (const frame of data) {
      for (const field of frame.fields) {
        const key = field.type || FieldType.other;
        let v = counts.get(key);
        if (!v) {
          v = 0;
        }
        counts.set(key, v + 1);
        total++;
      }
    }
    counts.set('*', total);
    return counts;
  }, [data]);
};

const useSelectOptions = (counts: Map<string, number>, opt?: string): Array<SelectableValue<string>> => {
  return useMemo(() => {
    let found = false;
    const options: Array<SelectableValue<string>> = [];
    for (const t of allTypes) {
      const count = counts.get(t.value!);
      const match = opt === t.value;
      if (count || match) {
        options.push({
          ...t,
          label: `${t.label} (${counts.get(t.value!)})`,
        });
      }
      if (match) {
        found = true;
      }
    }
    if (opt && !found) {
      options.push({
        value: opt,
        label: `${opt} (No matches)`,
      });
    }
    return options;
  }, [counts, opt]);
};

export const fieldTypeMatcherItem: FieldMatcherUIRegistryItem<string> = {
  id: FieldMatcherID.byType,
  component: FieldTypeMatcherEditor,
  matcher: fieldMatchers.get(FieldMatcherID.byType),
  name: 'Filter by type',
  description: 'Set properties for fields matching a type',
};
