import { promises as fs } from "node:fs";
import path from "node:path";

import { ProcesoEntrada, validarProcesos } from "../Core/process";

const parsearNumero = (valor: unknown, respaldo?: number): number => {
if (valor === undefined || valor === null || valor === "") {
if (respaldo !== undefined) {
return respaldo;
}
throw new Error("Se requiere un valor numérico");
}
const parseado = Number(valor);
if (Number.isNaN(parseado)) {
throw new Error(`Valor numérico inválido: ${valor}`);
}
return parseado;
};

const sanitizarProceso = (crudo: Record<string, unknown>, indice: number): ProcesoEntrada => {
if (!crudo.id) {
throw new Error(`Proceso en índice ${indice} no tiene id`);
}
// Mapeo flexible para soportar input en ingles o español si fuera necesario, o solo español.
// Asumimos entrada en español o inglés por compatibilidad básica si queremos, pero mejor estricto en el nuevo formato.
// Vamos a soportar ambas keys por robustez si se lee un json viejo.
const tiempoLlegada = parsearNumero(crudo.tiempoLlegada ?? crudo.arrivalTime, 0);
const tiempoRafaga = parsearNumero(crudo.tiempoRafaga ?? crudo.burstTime);
const prioridad = (crudo.prioridad !== undefined || crudo.priority !== undefined)
? parsearNumero(crudo.prioridad ?? crudo.priority)
: undefined;

return {
id: String(crudo.id),
tiempoLlegada,
tiempoRafaga,
prioridad,
};
};

/**
 * Lee procesos desde un archivo JSON.
 */
export const leerProcesosDesdeJson = async (rutaArchivo: string): Promise<ProcesoEntrada[]> => {
const contenido = await fs.readFile(rutaArchivo, "utf8");
const carga = JSON.parse(contenido);
if (!Array.isArray(carga)) {
throw new Error("El archivo JSON debe contener un array de procesos");
}
const procesos = carga.map((entrada, indice) => sanitizarProceso(entrada, indice));
validarProcesos(procesos);
return procesos;
};

const SEPARADORES_CSV = [",", ";", "\t"];

const detectarSeparador = (encabezado: string) => {
for (const sep of SEPARADORES_CSV) {
if (encabezado.includes(sep)) {
return sep;
}
}
return ",";
};

/**
 * Lee procesos desde un archivo CSV o TXT delimitado.
 */
export const leerProcesosDesdeCsv = async (rutaArchivo: string): Promise<ProcesoEntrada[]> => {
const contenido = await fs.readFile(rutaArchivo, "utf8");
const lineas = contenido
.split(/\r?\n/)
.map((linea) => linea.trim())
.filter((linea) => linea.length > 0 && !linea.startsWith("#"));

if (lineas.length === 0) {
return [];
}

const separador = detectarSeparador(lineas[0]);
const encabezados = lineas[0].split(separador).map((v) => v.trim());
const filas = lineas.slice(1);

const procesos = filas.map((fila, indice) => {
const valores = fila.split(separador).map((v) => v.trim());
const crudo: Record<string, unknown> = {};
encabezados.forEach((encabezado, idx) => {
crudo[encabezado] = valores[idx];
});
return sanitizarProceso(crudo, indice);
});

validarProcesos(procesos);
return procesos;
};

export const escribirProcesosAJson = async (rutaArchivo: string, procesos: ProcesoEntrada[]) => {
await fs.writeFile(rutaArchivo, JSON.stringify(procesos, null, 2), "utf8");
};

const aLineaCsv = (proceso: ProcesoEntrada) =>
[proceso.id, proceso.tiempoLlegada, proceso.tiempoRafaga, proceso.prioridad ?? ""].join(",");

export const escribirProcesosACsv = async (rutaArchivo: string, procesos: ProcesoEntrada[]) => {
const encabezado = "id,tiempoLlegada,tiempoRafaga,prioridad";
const filas = procesos.map((proc) => aLineaCsv(proc));
const carga = [encabezado, ...filas].join("\n");
await fs.writeFile(rutaArchivo, carga, "utf8");
};

/**
 * Carga procesos desde un archivo detectando formato por extensión.
 */
export const cargarProcesos = async (rutaArchivo: string): Promise<ProcesoEntrada[]> => {
const extension = path.extname(rutaArchivo).toLowerCase();
if (extension === ".json") {
return leerProcesosDesdeJson(rutaArchivo);
}
if (extension === ".csv" || extension === ".txt") {
return leerProcesosDesdeCsv(rutaArchivo);
}
throw new Error(`Formato de archivo no soportado: ${extension}`);
};

/**
 * Guarda procesos en un archivo detectando formato por extensión.
 */
export const guardarProcesos = async (rutaArchivo: string, procesos: ProcesoEntrada[]) => {
const extension = path.extname(rutaArchivo).toLowerCase();
if (extension === ".json") {
await escribirProcesosAJson(rutaArchivo, procesos);
return;
}
if (extension === ".csv" || extension === ".txt") {
await escribirProcesosACsv(rutaArchivo, procesos);
return;
}
throw new Error(`Formato de archivo no soportado: ${extension}`);
};
