import styles from "./Card.module.css";
import { clsx } from "clsx";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  glass?: boolean;
  onClick?: () => void;
}

export const Card = ({ children, className, glass, onClick }: CardProps) => {
  return (
    <div 
      className={clsx(styles.card, glass && "glass", className)}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      {children}
    </div>
  );
};
