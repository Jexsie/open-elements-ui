"use client";

import * as React from "react";
import { useState } from "react";
import {
  ChevronDown,
  CircleUser,
  LayoutDashboard,
  LogOut,
  Menu,
} from "lucide-react";
import { cn } from "../lib/utils";
import { Button } from "./button";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "./tooltip";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "./sheet";
import { LanguageSwitch } from "./language-switch";

// --- NavItem ---

interface NavItemProps {
  readonly href: string;
  readonly icon: React.ReactNode;
  readonly label: string;
  readonly active?: boolean;
  readonly indented?: boolean;
  readonly onClick?: () => void;
}

function NavItem({ href, icon, label, active, indented, onClick }: NavItemProps) {
  return (
    <a
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        indented && "pl-10",
        active
          ? "bg-oe-green/20 text-oe-green"
          : "text-oe-white/70 hover:bg-oe-white/10 hover:text-oe-white",
      )}
    >
      {icon}
      {label}
    </a>
  );
}

// --- CollapsibleGroup ---

interface CollapsibleGroupProps {
  readonly icon: React.ReactNode;
  readonly label: string;
  readonly defaultOpen?: boolean;
  readonly active?: boolean;
  readonly children: React.ReactNode;
}

function CollapsibleGroup({ icon, label, defaultOpen = false, active, children }: CollapsibleGroupProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors w-full text-left",
          active
            ? "text-oe-white"
            : "text-oe-white/70 hover:bg-oe-white/10 hover:text-oe-white",
        )}
      >
        {icon}
        {label}
        <ChevronDown
          className={cn(
            "ml-auto h-4 w-4 transition-transform",
            open ? "rotate-0" : "-rotate-90",
          )}
        />
      </button>
      {open && (
        <div className="flex flex-col gap-1">
          {children}
        </div>
      )}
    </>
  );
}

// --- UserSection ---

interface UserSectionTranslations {
  readonly uploadAvatar: string;
  readonly logout: string;
  readonly noRoles: string;
}

interface UserSectionProps {
  readonly userName: string;
  readonly avatarUrl?: string;
  readonly roles?: readonly string[];
  readonly onAvatarClick?: () => void;
  readonly onLogout: () => void;
  readonly translations: UserSectionTranslations;
}

function UserSection({ userName, avatarUrl, roles, onAvatarClick, onLogout, translations: t }: UserSectionProps) {
  return (
    <div className="border-t border-oe-white/10 px-6 py-4">
      <div className="flex items-center gap-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={onAvatarClick}
              className="shrink-0"
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={userName}
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <CircleUser className="h-8 w-8 text-oe-gray-light" />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent>{t.uploadAvatar}</TooltipContent>
        </Tooltip>
        <div className="flex-1 min-w-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <p className="text-sm font-medium text-oe-white truncate cursor-default">{userName}</p>
            </TooltipTrigger>
            <TooltipContent>
              {roles && roles.length > 0
                ? roles.join(", ")
                : t.noRoles}
            </TooltipContent>
          </Tooltip>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-oe-white/70 hover:bg-oe-white/10 hover:text-oe-white"
              onClick={onLogout}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t.logout}</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}

// --- SidebarHeader ---

interface SidebarHeaderProps {
  readonly appTitle: string;
  readonly logoIcon?: React.ReactNode;
  readonly homeHref?: string;
  readonly developedByText?: string;
}

function SidebarHeader({ appTitle, logoIcon, homeHref = "/", developedByText = "Developed by" }: SidebarHeaderProps) {
  return (
    <div className="border-b border-oe-white/10 px-6 py-4">
      <a href={homeHref} className="flex items-center gap-3">
        {logoIcon ?? <LayoutDashboard className="h-6 w-6 text-oe-green" />}
        <span className="font-heading text-lg font-bold text-oe-white">{appTitle}</span>
      </a>
      <a
        href="https://open-elements.com"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 flex items-center gap-2 opacity-70 hover:opacity-100 transition-opacity"
      >
        <span className="text-xs text-oe-gray-light">{developedByText}</span>
        <img
          src="/oe-logo-landscape-dark.svg"
          alt="Open Elements"
          className="h-4"
        />
      </a>
    </div>
  );
}

// --- Sidebar ---

interface SidebarProps {
  readonly appTitle: string;
  readonly header?: React.ReactNode;
  readonly user?: UserSectionProps;
  readonly children: React.ReactNode;
  readonly bottomChildren?: React.ReactNode;
  readonly menuLabel?: string;
  readonly homeHref?: string;
  readonly developedByText?: string;
}

function Sidebar({
  appTitle,
  header,
  user,
  children,
  bottomChildren,
  menuLabel = "Menu",
  homeHref,
  developedByText,
}: SidebarProps) {
  const [open, setOpen] = useState(false);

  const headerContent = header ?? (
    <SidebarHeader appTitle={appTitle} homeHref={homeHref} developedByText={developedByText} />
  );

  const bottomSection = (
    <div>
      <div className="border-t border-oe-white/10 px-6 py-4">
        <LanguageSwitch />
      </div>
      {user && <UserSection {...user} />}
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-oe-dark">
        {headerContent}
        <div className="flex flex-1 flex-col">
          <nav className="flex flex-col gap-1 px-3 py-4">
            {children}
          </nav>
          {bottomChildren && (
            <div className="mt-auto flex flex-col gap-1 px-3 pb-2">
              {bottomChildren}
            </div>
          )}
        </div>
        {bottomSection}
      </aside>

      {/* Mobile header + hamburger */}
      <header className="flex md:hidden h-14 items-center border-b border-oe-gray-light bg-oe-dark px-4">
        <Sheet open={open} onOpenChange={setOpen}>
          <Tooltip>
            <TooltipTrigger asChild>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-oe-white hover:bg-oe-white/10">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">{menuLabel}</span>
                </Button>
              </SheetTrigger>
            </TooltipTrigger>
            <TooltipContent>{menuLabel}</TooltipContent>
          </Tooltip>
          <SheetContent side="left" className="w-64 bg-oe-dark p-0 border-none flex flex-col">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            {headerContent}
            <div className="flex flex-1 flex-col">
              <nav className="flex flex-col gap-1 px-3 py-4">
                {React.Children.map(children, (child) => {
                  if (React.isValidElement<NavItemProps>(child) && child.type === NavItem) {
                    return React.cloneElement(child, {
                      onClick: () => { child.props.onClick?.(); setOpen(false); },
                    });
                  }
                  return child;
                })}
              </nav>
              {bottomChildren && (
                <div className="mt-auto flex flex-col gap-1 px-3 pb-2">
                  {bottomChildren}
                </div>
              )}
            </div>
            {bottomSection}
          </SheetContent>
        </Sheet>
        <span className="ml-3 font-heading text-lg font-bold text-oe-white">{appTitle}</span>
      </header>
    </>
  );
}

export {
  Sidebar,
  SidebarHeader,
  NavItem,
  CollapsibleGroup,
  UserSection,
};
export type {
  SidebarProps,
  SidebarHeaderProps,
  NavItemProps,
  CollapsibleGroupProps,
  UserSectionProps,
  UserSectionTranslations,
};
