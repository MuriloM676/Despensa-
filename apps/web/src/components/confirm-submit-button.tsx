"use client";

import type { MouseEvent } from "react";

export function ConfirmSubmitButton({
  message,
  className,
  title,
  children,
}: {
  message: string;
  className?: string;
  title?: string;
  children: React.ReactNode;
}) {
  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    if (!window.confirm(message)) {
      event.preventDefault();
    }
  }

  return (
    <button type="submit" className={className} title={title} onClick={handleClick}>
      {children}
    </button>
  );
}
