import { machine6064 } from "./6064";
import { machine5825 } from "./5825";
import { machine1572 } from "./1572";
import { machine5759 } from "./5759";
import { machine1516 } from "./1516";
import { machine618 } from "./618";
import { machine725 } from "./725";
import { machine6003 } from "./6003";
import { machine904 } from "./904";
import { machine641 } from "./641";
import { machine646 } from "./646";

const machineList = [
  machine6064,
  machine5825,
  machine1572,
  machine5759,
  machine1516,
  machine618,
  machine725,
  machine6003,
  machine904,
  machine641,
  machine646,
];

export const machines = [...machineList].sort(
  (a, b) => a.ordem - b.ordem
);

export const machinesById = {
  "6064": machine6064,
  "5825": machine5825,
  "1572": machine1572,
  "5759": machine5759,
  "1516": machine1516,
  "618": machine618,
  "725": machine725,
  "6003": machine6003,
  "904": machine904,
  "641": machine641,
  "646": machine646,
};