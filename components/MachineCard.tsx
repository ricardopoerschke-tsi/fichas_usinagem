"use client";

import type React from "react";
import { motion } from "framer-motion";
import type { Machine } from "@/types/machine";

type MachineCardProps = {
  machine: Machine;
  fila: number;
  status: string;
  progresso: number;
  onClick: () => void;
};

const machineTheme: Record<
  string,
  { accent: string; accentRgb: string; label: string }
> = {
  "6064": { accent: "#2878ff", accentRgb: "40, 120, 255", label: "CNC" },
  "1572": { accent: "#3fc45a", accentRgb: "63, 196, 90", label: "FRESA" },
  "5759": { accent: "#3fc45a", accentRgb: "32, 183, 168", label: "FRESA" },
  "725": { accent: "#ff7a12", accentRgb: "255, 122, 18", label: "FRESA CNC" },
  "5825": { accent: "#8a4cff", accentRgb: "138, 76, 255", label: "TORNO CNC" },
  "1516": {
    accent: "#ffc21a",
    accentRgb: "255, 194, 26",
    label: "MANDRILHADORA",
  },
  "618": {
    accent: "#d8a51f",
    accentRgb: "216, 165, 31",
    label: "MANDRILHADORA",
  },
};

export function MachineCard({
  machine,
  fila,
  status,
  progresso,
  onClick,
}: MachineCardProps) {
  const theme = machineTheme[machine.id] ?? machineTheme["6064"];

  return (
    <motion.div
      whileHover={{ y: -5 }}
      whileTap={{ scale: 0.99 }}
      className="machine-card-motion"
    >
      <button
        type="button"
        className="machine-card"
        style={
          {
            "--machine-accent": theme.accent,
            "--machine-accent-rgb": theme.accentRgb,
          } as React.CSSProperties
        }
        onClick={onClick}
        aria-label={`Selecionar máquina ${machine.numero} ${machine.nome}`}
      >
        <span className="machine-card__glow" aria-hidden="true" />

        <div className="machine-card__top">
          <p className="machine-card__number">{machine.numero}</p>
          <p className="machine-card__name">{machine.nome}</p>
          <span className="machine-card__label">{theme.label}</span>
        </div>

        <div className="machine-card__divider" />

        <div className="machine-card__queue">
          <strong>{fila}</strong>
          <span>peças na fila</span>
        </div>

        <div className="machine-card__status">
          <span className="machine-card__status-line">
            <span className="machine-card__status-dot" />
            {status}
          </span>
          <span className="machine-card__action">Selecionar máquina →</span>
        </div>

        <div
          className="machine-card__progress"
          aria-label={`Carga relativa da fila: ${progresso}%`}
        >
          <span style={{ width: `${progresso}%` }} />
        </div>
      </button>
    </motion.div>
  );
}
