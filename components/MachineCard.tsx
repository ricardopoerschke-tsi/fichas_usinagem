import { motion } from "framer-motion";
import { Factory } from "lucide-react";
import type { Machine } from "@/types/machine";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";

type MachineCardProps = {
  machine: Machine;
  fila: number;
  status: string;
  onClick: () => void;
};

export function MachineCard({
  machine,
  fila,
  status,
  onClick,
}: MachineCardProps) {
  return (
    <motion.div whileHover={{ scale: 1.02 }}>
      <Card
        className="cursor-pointer rounded-2xl shadow-md"
        onClick={onClick}
      >
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-slate-200 p-3">
              <Factory size={28} />
            </div>

            <div>
              <h2 className="text-xl font-bold">
                Maq: {machine.numero} {machine.nome}
              </h2>

              <p className="text-sm text-slate-600">
                {machine.tipo} • {machine.material}
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-white p-3">
              <p className="text-slate-500">Fila</p>
              <p className="text-lg font-semibold">
                {fila} peças
              </p>
            </div>

            <div className="rounded-xl bg-white p-3">
              <p className="text-slate-500">Status</p>
              <p className="text-lg font-semibold">
                {status}
              </p>
            </div>
          </div>

          <Button className="mt-6 w-full">
            Entrar na máquina
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}