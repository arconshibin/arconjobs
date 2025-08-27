// src/components/PageCard.tsx
import React from "react";
import { Card } from "@heroui/react";

export default function PageCard({
  title,
  actions,
  children,
  className = "",
  bodyClassName = "",
}: {
  title: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <Card className={`bg-white shadow-medium ${className}`}>
      <div className="flex items-center justify-between px-6 py-4 border-b border-divider">
        <h1 className="text-xl md:text-2xl font-semibold">{title}</h1>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
      <div className={`p-6 ${bodyClassName}`}>{children}</div>
    </Card>
  );
}
