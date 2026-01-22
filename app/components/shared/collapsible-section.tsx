"use client";

import { useState, ReactNode } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface CollapsibleSectionProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  iconBgColor?: string;
  iconColor?: string;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
  headerActions?: ReactNode;
  headerContent?: ReactNode;
}

export function CollapsibleSection({
  title,
  subtitle,
  icon,
  iconBgColor = "bg-blue-100 dark:bg-blue-950",
  iconColor = "text-blue-600 dark:text-blue-400",
  children,
  defaultOpen = true,
  className,
  headerActions,
  headerContent,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Card className={cn("bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 overflow-hidden", className)}>
      <div className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            {icon && (
              <div className={cn("flex items-center justify-center w-10 h-10 rounded-lg", iconBgColor)}>
                <span className={iconColor}>{icon}</span>
              </div>
            )}
            <div className="text-left">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900 dark:text-white">
                {title}
              </h2>
              {subtitle && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {subtitle}
                </p>
              )}
            </div>
            <div className={cn(
              "flex items-center justify-center w-8 h-8 rounded-full transition-colors ml-2",
              isOpen
                ? "bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400"
                : "bg-slate-100 dark:bg-slate-800 text-slate-500"
            )}>
              {isOpen ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </div>
          </button>
          {headerActions && (
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              {headerActions}
            </div>
          )}
        </div>
        {headerContent && isOpen && (
          <div className="mt-4">
            {headerContent}
          </div>
        )}
      </div>
      <div
        className={cn(
          "transition-all duration-300 ease-in-out overflow-hidden",
          isOpen ? "max-h-[5000px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="px-4 sm:px-6 pb-4 sm:pb-6 pt-0">
          {children}
        </div>
      </div>
    </Card>
  );
}
