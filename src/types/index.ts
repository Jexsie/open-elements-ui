export interface TagDto {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly color: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly companyCount: number | null;
  readonly contactCount: number | null;
  readonly taskCount: number | null;
}

export interface TagOption {
  readonly value: string;
  readonly label: string;
  readonly color: string;
}

export interface TagMultiSelectTranslations {
  readonly placeholder: string;
  readonly empty: string;
}

export interface TagMultiSelectProps {
  readonly selectedIds: readonly string[];
  readonly onChange: (ids: string[]) => void;
  readonly loadTags: () => Promise<TagOption[]>;
  readonly translations: TagMultiSelectTranslations;
}
