// Components
export { Button, buttonVariants } from "./components/button.tsx";
export { Input } from "./components/input.tsx";
export { Textarea } from "./components/textarea.tsx";
export {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupInput,
  InputGroupTextarea,
} from "./components/input-group.tsx";
export {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxGroup,
  ComboboxLabel,
  ComboboxCollection,
  ComboboxEmpty,
  ComboboxSeparator,
  ComboboxChips,
  ComboboxChip,
  ComboboxChipsInput,
  ComboboxTrigger,
  ComboboxValue,
  useComboboxAnchor,
} from "./components/combobox.tsx";
export { TagMultiSelect } from "./components/tag-multi-select.tsx";
export type {
  TagMultiSelectProps,
  TagMultiSelectTranslations,
  TagOption,
} from "./components/tag-multi-select.tsx";

// shadcn/ui components
export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./components/alert-dialog.tsx";
export { Badge, badgeVariants } from "./components/badge.tsx";
export { Calendar, CalendarDayButton } from "./components/calendar.tsx";
export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
} from "./components/card.tsx";
export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from "./components/dialog.tsx";
export { Label } from "./components/label.tsx";
export {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverAnchor,
  PopoverHeader,
  PopoverTitle,
  PopoverDescription,
} from "./components/popover.tsx";
export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "./components/select.tsx";
export { Separator } from "./components/separator.tsx";
export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
} from "./components/sheet.tsx";
export { Skeleton } from "./components/skeleton.tsx";
export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from "./components/table.tsx";
export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "./components/tooltip.tsx";

// App-level components
export { DeleteConfirmDialog } from "./components/delete-confirm-dialog.tsx";
export type { DeleteConfirmDialogProps } from "./components/delete-confirm-dialog.tsx";
export { DetailField } from "./components/detail-field.tsx";
export type { DetailFieldProps, DetailFieldTranslations } from "./components/detail-field.tsx";
export { LanguageSwitch } from "./components/language-switch.tsx";
export { HealthStatus } from "./components/health-status.tsx";
export type { HealthStatusProps, HealthStatusTranslations } from "./components/health-status.tsx";
export { TagChips } from "./components/tag-chips.tsx";
export type { TagChipsProps } from "./components/tag-chips.tsx";
export { TagForm } from "./components/tag-form.tsx";
export type { TagFormProps, TagFormTranslations } from "./components/tag-form.tsx";
export {
  Sidebar,
  SidebarHeader,
  NavItem,
  CollapsibleGroup,
  UserSection,
} from "./components/sidebar.tsx";
export type {
  SidebarProps,
  SidebarHeaderProps,
  NavItemProps,
  CollapsibleGroupProps,
  UserSectionProps,
  UserSectionTranslations,
} from "./components/sidebar.tsx";

// Markdown components
export { MarkdownEditor } from "./components/markdown-editor.tsx";
export { MarkdownView } from "./components/markdown-view.tsx";

// User components
export { UserAvatar } from "./components/user-avatar.tsx";
export { UserMultiSelect } from "./components/user-multi-select.tsx";

// Action buttons
export { ActionIconButton } from "./components/action-icon-button.tsx";
export { CopyToClipboardButton } from "./components/copy-to-clipboard-button.tsx";
export { ExternalLinkButton } from "./components/external-link-button.tsx";
export { MailtoButton } from "./components/mailto-button.tsx";
export { TooltipIconButton } from "./components/tooltip-icon-button.tsx";
export type { TooltipIconButtonProps } from "./components/tooltip-icon-button.tsx";

// Table pagination
export { TablePagination } from "./components/table-pagination.tsx";
export type { PaginationTranslations } from "./components/table-pagination.tsx";

// Types
export type { TagDto } from "./types/index.ts";
export type {
  UserOption,
  UserAvatarProps,
  UserMultiSelectProps,
  UserMultiSelectTranslations,
  MarkdownEditorProps,
  MarkdownViewProps,
} from "./types/index.ts";

// Utilities
export { cn } from "./lib/utils.ts";

// i18n
export { LanguageProvider, useTranslations, useLanguage } from "./i18n/language-context.tsx";
export type { Language } from "./i18n/language-context.tsx";
export { de } from "./i18n/de.ts";
export { en } from "./i18n/en.ts";
