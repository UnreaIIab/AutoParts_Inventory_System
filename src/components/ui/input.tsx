import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  invalid?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, leftIcon, rightIcon, invalid, ...props }, ref) => {
    return (
      <div className="relative flex items-center">
        {leftIcon && (
          <span className="pointer-events-none absolute left-3 text-content-subtle">
            {leftIcon}
          </span>
        )}
        <input
          ref={ref}
          className={cn(
            "h-9 w-full rounded border bg-surface px-3 text-sm text-content placeholder:text-content-subtle transition-colors focus-ring disabled:cursor-not-allowed disabled:bg-surface-muted",
            invalid
              ? "border-danger focus-visible:ring-danger/30"
              : "border-border-strong hover:border-content-subtle",
            leftIcon && "pl-9",
            rightIcon && "pr-9",
            className,
          )}
          {...props}
        />
        {rightIcon && (
          <span className="absolute right-3 text-content-subtle">
            {rightIcon}
          </span>
        )}
      </div>
    );
  },
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }
>(({ className, invalid, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        "w-full rounded border bg-surface px-3 py-2 text-sm text-content placeholder:text-content-subtle transition-colors focus-ring disabled:bg-surface-muted",
        invalid
          ? "border-danger focus-visible:ring-danger/30"
          : "border-border-strong hover:border-content-subtle",
        className,
      )}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }
>(({ className, invalid, children, ...props }, ref) => {
  return (
    <select
      ref={ref}
      className={cn(
        "h-9 w-full appearance-none rounded border bg-surface bg-[length:16px] bg-[right_0.6rem_center] bg-no-repeat px-3 pr-8 text-sm text-content transition-colors focus-ring disabled:bg-surface-muted",
        "bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22%236b6f76%22%20stroke-width%3D%222%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20d%3D%22M19%209l-7%207-7-7%22%2F%3E%3C%2Fsvg%3E')]",
        invalid
          ? "border-danger focus-visible:ring-danger/30"
          : "border-border-strong hover:border-content-subtle",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
});
Select.displayName = "Select";

export function Label({
  className,
  required,
  children,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement> & { required?: boolean }) {
  return (
    <label
      className={cn(
        "mb-1.5 block text-xs font-medium text-content-muted",
        className,
      )}
      {...props}
    >
      {children}
      {required && <span className="ml-0.5 text-danger">*</span>}
    </label>
  );
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-danger">{message}</p>;
}
