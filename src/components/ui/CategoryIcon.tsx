"use client";

import * as LucideIcons from "lucide-react";

interface CategoryIconProps {
  name: string;
  size?: number;
  color?: string;
  className?: string;
}

export const CategoryIcon = ({ name, size = 20, color, className }: CategoryIconProps) => {
  const Icon = (LucideIcons as any)[name];
  if (!Icon) return <span style={{ fontSize: size * 0.8 }}>{name[0]}</span>;
  return <Icon size={size} color={color} className={className} />;
};
