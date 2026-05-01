import styles from "./Card.module.css";
import { clsx } from "clsx";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  glass?: boolean;
}

export const Card = ({ children, className, glass }: CardProps) => {
  return (
    <div className={clsx(styles.card, glass && "glass", className)}>
      {children}
    </div>
  );
};
