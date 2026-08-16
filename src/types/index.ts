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

/**
 * A single action offered in the {@link MarkdownEditorProps.toolbar}. Names follow
 * the underlying TipTap node/mark names so the mapping to commands is obvious.
 * Unlink is deliberately absent — it is rendered contextually as part of `"link"`.
 */
export type MarkdownToolbarAction =
  | "bold"
  | "italic"
  | "strike"
  | "code"
  | "link"
  | "h1"
  | "h2"
  | "h3"
  | "bulletList"
  | "orderedList"
  | "taskList"
  | "blockquote"
  | "codeBlock"
  | "horizontalRule";

export interface MarkdownEditorProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly placeholder?: string;
  /** Actions offered in the toolbar, in render order. Defaults to `["bold", "italic"]`. */
  readonly toolbar?: readonly MarkdownToolbarAction[];
}

export interface MarkdownViewProps {
  readonly content: string;
  /**
   * Called when the reader toggles a task list checkbox, with the complete
   * updated Markdown. Omit to render checkboxes as read-only.
   *
   * Return a Promise to have the view disable interaction until it settles and
   * revert the document if it rejects. Return nothing (`void`) to apply the
   * toggle without a busy state or rollback.
   */
  readonly onChange?: (markdown: string) => void | Promise<void>;
}
