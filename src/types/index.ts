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

export interface UserOption {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly avatarUrl?: string | null;
}

export interface UserAvatarProps {
  readonly user: UserOption;
  readonly size?: "sm" | "md";
}

export interface UserMultiSelectTranslations {
  readonly placeholder: string;
  readonly searchPlaceholder: string;
  readonly empty: string;
}

export interface UserMultiSelectProps {
  readonly users: readonly UserOption[];
  readonly selectedIds: readonly string[];
  readonly onChange: (ids: string[]) => void;
  readonly disabledIds?: readonly string[];
  readonly translations: UserMultiSelectTranslations;
}

export interface MarkdownEditorProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly placeholder?: string;
}

export interface MarkdownViewProps {
  readonly content: string;
}
