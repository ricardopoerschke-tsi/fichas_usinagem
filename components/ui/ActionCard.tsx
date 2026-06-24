import React from "react";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

type ActionCardProps = {
  icon: React.ReactElement<{ size?: number }>;
  title: string;
  description: string;
  onClick?: () => void;
};

export function ActionCard({
  icon,
  title,
  description,
  onClick,
}: ActionCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      whileTap={onClick ? { scale: 0.99 } : undefined}
      onClick={onClick}
      className={`machine-action-card ${onClick ? "is-interactive" : ""}`}
    >
      <div className="machine-action-card__icon">
        {React.cloneElement(icon, { size: 27 })}
      </div>

      <div className="machine-action-card__content">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>

      <span className="machine-action-card__arrow" aria-hidden="true">
        <ArrowUpRight size={19} />
      </span>
    </motion.div>
  );
}
