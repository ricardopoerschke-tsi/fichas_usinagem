import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const sourcePath = path.join(
  testDir,
  "..",
  "sequencing",
  "congelamento.ts"
);
const source = fs.readFileSync(sourcePath, "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2020,
  },
}).outputText;
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "congelamento-"));
const compiledPath = path.join(tempDir, "congelamento.mjs");

fs.writeFileSync(compiledPath, compiled, "utf8");

const {
  localizarLimiteCongelado,
  sequenciarRespeitandoCongelamento,
} = await import(pathToFileURL(compiledPath).href);

test.after(() => {
  fs.rmSync(tempDir, { force: true, recursive: true });
});

function peca(desenho, ordemMes) {
  return { desenho, ordemMes };
}

test("preserva o prefixo e diferencia desenhos duplicados pela Ordem MES", () => {
  const sequencia = [
    peca("M0836425", "78479"),
    peca("M0836425", "78480"),
    peca("B", "3"),
    peca("C", "4"),
  ];
  const congelamento = {
    ultimaPeca: { desenho: "M0836425", ordemMes: "78480" },
  };

  const resultado = sequenciarRespeitandoCongelamento(
    sequencia,
    congelamento,
    (parteLivre) => [...parteLivre].reverse()
  );

  assert.deepEqual(
    resultado.sequencia.map((item) => item.ordemMes),
    ["78479", "78480", "4", "3"]
  );
  assert.equal(resultado.limiteCongelado, 1);
});

test("relocaliza a peça congelada quando sua posição atual muda", () => {
  const congelamento = {
    ultimaPeca: { desenho: "A", ordemMes: "2" },
  };
  const sequenciaAlterada = [
    peca("NOVA", "9"),
    peca("A", "1"),
    peca("A", "2"),
    peca("B", "3"),
  ];

  assert.equal(
    localizarLimiteCongelado(sequenciaAlterada, congelamento),
    2
  );
});

test("não recalcula a fila quando a referência congelada não é localizada", () => {
  const sequencia = [peca("A", "1"), peca("B", "2")];
  let algoritmoExecutado = false;

  const resultado = sequenciarRespeitandoCongelamento(
    sequencia,
    { ultimaPeca: { desenho: "INEXISTENTE", ordemMes: "99" } },
    (parteLivre) => {
      algoritmoExecutado = true;
      return parteLivre;
    }
  );

  assert.equal(resultado.referenciaEncontrada, false);
  assert.equal(resultado.sequencia, sequencia);
  assert.equal(algoritmoExecutado, false);
});

test("aplica o algoritmo à fila inteira quando não há congelamento", () => {
  const sequencia = [peca("A", "1"), peca("B", "2")];

  const resultado = sequenciarRespeitandoCongelamento(
    sequencia,
    null,
    (itens) => [...itens].reverse()
  );

  assert.deepEqual(
    resultado.sequencia.map((item) => item.desenho),
    ["B", "A"]
  );
});
