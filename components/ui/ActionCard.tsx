import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "./Card";

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
    <motion.div whileHover={{ y: -4 }} onClick={onClick}>
      <Card className="h-full cursor-pointer rounded-2xl shadow-md">
        <CardContent className="flex h-full flex-col gap-3 p-5">
          <div className="w-fit rounded-2xl bg-slate-200 p-3">
            {React.cloneElement(icon, { size: 26 })}
          </div>

          <h3 className="text-lg font-bold">{title}</h3>
          <p className="text-sm text-slate-600">{description}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}