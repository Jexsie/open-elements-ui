// Components
export { Button, buttonVariants } from "./components/button";
export { Input } from "./components/input";
export { Textarea } from "./components/textarea";
export {
  InputGroup, InputGroupAddon, InputGroupButton,
  InputGroupText, InputGroupInput, InputGroupTextarea,
} from "./components/input-group";
export {
  Combobox, ComboboxInput, ComboboxContent, ComboboxList, ComboboxItem,
  ComboboxGroup, ComboboxLabel, ComboboxCollection, ComboboxEmpty,
  ComboboxSeparator, ComboboxChips, ComboboxChip, ComboboxChipsInput,
  ComboboxTrigger, ComboboxValue, useComboboxAnchor,
} from "./components/combobox";
export { TagMultiSelect } from "./components/tag-multi-select";
export type { TagMultiSelectProps, TagMultiSelectTranslations, TagOption } from "./components/tag-multi-select";

// shadcn/ui components
export {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogMedia,
  AlertDialogOverlay, AlertDialogPortal, AlertDialogTitle, AlertDialogTrigger,
} from "./components/alert-dialog";
export { Badge, badgeVariants } from "./components/badge";
export { Calendar, CalendarDayButton } from "./components/calendar";
export {
  Card, CardHeader, CardFooter, CardTitle, CardAction,
  CardDescription, CardContent,
} from "./components/card";
export {
  Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogOverlay, DialogPortal, DialogTitle, DialogTrigger,
} from "./components/dialog";
export { Label } from "./components/label";
export {
  Popover, PopoverTrigger, PopoverContent, PopoverAnchor,
  PopoverHeader, PopoverTitle, PopoverDescription,
} from "./components/popover";
export {
  Select, SelectContent, SelectGroup, SelectItem, SelectLabel,
  SelectScrollDownButton, SelectScrollUpButton, SelectSeparator,
  SelectTrigger, SelectValue,
} from "./components/select";
export { Separator } from "./components/separator";
export {
  Sheet, SheetTrigger, SheetClose, SheetContent, SheetHeader,
  SheetFooter, SheetTitle, SheetDescription,
} from "./components/sheet";
export { Skeleton } from "./components/skeleton";
export {
  Table, TableHeader, TableBody, TableFooter, TableHead,
  TableRow, TableCell, TableCaption,
} from "./components/table";
export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "./components/tooltip";

// App-level components
export { LanguageSwitch } from "./components/language-switch";
export { HealthStatus } from "./components/health-status";
export type { HealthStatusProps, HealthStatusTranslations } from "./components/health-status";
export { TagChips } from "./components/tag-chips";
export type { TagChipsProps } from "./components/tag-chips";
export { TagForm } from "./components/tag-form";
export type { TagFormProps, TagFormTranslations } from "./components/tag-form";
export {
  Sidebar, SidebarHeader, NavItem, CollapsibleGroup, UserSection,
} from "./components/sidebar";
export type {
  SidebarProps, SidebarHeaderProps, NavItemProps, CollapsibleGroupProps,
  UserSectionProps, UserSectionTranslations,
} from "./components/sidebar";

// Types
export type { TagDto } from "./types";

// Utilities
export { cn } from "./lib/utils";

// i18n
export { LanguageProvider, useTranslations, useLanguage } from "./i18n/language-context";
export type { Language } from "./i18n/language-context";
export { de } from "./i18n/de";
export { en } from "./i18n/en";
