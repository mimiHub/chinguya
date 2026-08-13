"use client";

import NextLink from "next/link";
import type { AnchorHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "accent" | "muted" | "danger";
type Size = "sm" | "md" | "lg";
type Underline = "hover" | "always" | "none";
type Align = "start" | "center" | "end";

const variantClass: Record<Variant, string> = {
  primary: "text-primary-500 hover:text-primary-600",
  secondary: "text-secondary-700 hover:text-secondary-800",
  accent: "text-accent-600 hover:text-accent-800",
  muted: "text-gray-500 hover:text-gray-800",
  danger: "text-error hover:text-[#d63c3c]",
};

const sizeClass: Record<Size, string> = {
  sm: "text-sm gap-1",
  md: "text-base gap-1.5",
  lg: "text-lg gap-2",
};

const underlineClass: Record<Underline, string> = {
  hover: "hover:underline",
  always: "underline",
  none: "no-underline",
};

const alignClass: Record<Align, string> = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
};

export interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  variant?: Variant;
  size?: Size;
  underline?: Underline;
  align?: Align;
  fullWidth?: boolean;
  external?: boolean;
  className?: string;
  children?: ReactNode;
}

/** 공용 링크. variant/size/underline/align으로 스타일을 조합한다. */
export function Link({
  href,
  variant = "primary",
  size = "md",
  underline = "hover",
  align = "start",
  fullWidth = false,
  external = false,
  className = "",
  children,
  ...rest
}: LinkProps) {
  const classNames = [
    "inline-flex items-center font-medium no-underline cursor-pointer transition-colors",
    variantClass[variant],
    sizeClass[size],
    underlineClass[underline],
    alignClass[align],
    fullWidth ? "w-full" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const externalProps = external ? { target: "_blank", rel: "noopener noreferrer" } : {};

  return (
    <NextLink href={href} className={classNames} {...externalProps} {...rest}>
      {children}
    </NextLink>
  );
}

export interface LinkButtonProps {
  href: string;
  className?: string;
  children?: ReactNode;
}

/** 버튼처럼 보이는 링크(원본 Link.module.css .button 스타일). Button href 사용을 권장하되, 호환용으로 유지. */
Link.Button = function LinkButton({ href, className = "", children }: LinkButtonProps) {
  return (
    <NextLink
      href={href}
      className={`inline-flex h-10 items-center justify-center rounded-md bg-primary-500 px-6 font-medium text-white no-underline transition-colors hover:bg-primary-600 ${className}`}
    >
      {children}
    </NextLink>
  );
};
