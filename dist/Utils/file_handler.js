"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.guardarProcesos = exports.cargarProcesos = exports.escribirProcesosACsv = exports.escribirProcesosAJson = exports.leerProcesosDesdeCsv = exports.leerProcesosDesdeJson = void 0;
const node_fs_1 = require("node:fs");
const node_path_1 = __importDefault(require("node:path"));
const process_1 = require("../Core/process");
const parsearNumero = (valor, respaldo) => {
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
const sanitizarProceso = (crudo, indice) => {
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
const leerProcesosDesdeJson = async (rutaArchivo) => {
    const contenido = await node_fs_1.promises.readFile(rutaArchivo, "utf8");
    const carga = JSON.parse(contenido);
    if (!Array.isArray(carga)) {
        throw new Error("El archivo JSON debe contener un array de procesos");
    }
    const procesos = carga.map((entrada, indice) => sanitizarProceso(entrada, indice));
    (0, process_1.validarProcesos)(procesos);
    return procesos;
};
exports.leerProcesosDesdeJson = leerProcesosDesdeJson;
const SEPARADORES_CSV = [",", ";", "\t"];
const detectarSeparador = (encabezado) => {
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
const leerProcesosDesdeCsv = async (rutaArchivo) => {
    const contenido = await node_fs_1.promises.readFile(rutaArchivo, "utf8");
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
        const crudo = {};
        encabezados.forEach((encabezado, idx) => {
            crudo[encabezado] = valores[idx];
        });
        return sanitizarProceso(crudo, indice);
    });
    (0, process_1.validarProcesos)(procesos);
    return procesos;
};
exports.leerProcesosDesdeCsv = leerProcesosDesdeCsv;
const escribirProcesosAJson = async (rutaArchivo, procesos) => {
    await node_fs_1.promises.writeFile(rutaArchivo, JSON.stringify(procesos, null, 2), "utf8");
};
exports.escribirProcesosAJson = escribirProcesosAJson;
const aLineaCsv = (proceso) => [proceso.id, proceso.tiempoLlegada, proceso.tiempoRafaga, proceso.prioridad ?? ""].join(",");
const escribirProcesosACsv = async (rutaArchivo, procesos) => {
    const encabezado = "id,tiempoLlegada,tiempoRafaga,prioridad";
    const filas = procesos.map((proc) => aLineaCsv(proc));
    const carga = [encabezado, ...filas].join("\n");
    await node_fs_1.promises.writeFile(rutaArchivo, carga, "utf8");
};
exports.escribirProcesosACsv = escribirProcesosACsv;
/**
 * Carga procesos desde un archivo detectando formato por extensión.
 */
const cargarProcesos = async (rutaArchivo) => {
    const extension = node_path_1.default.extname(rutaArchivo).toLowerCase();
    if (extension === ".json") {
        return (0, exports.leerProcesosDesdeJson)(rutaArchivo);
    }
    if (extension === ".csv" || extension === ".txt") {
        return (0, exports.leerProcesosDesdeCsv)(rutaArchivo);
    }
    throw new Error(`Formato de archivo no soportado: ${extension}`);
};
exports.cargarProcesos = cargarProcesos;
/**
 * Guarda procesos en un archivo detectando formato por extensión.
 */
const guardarProcesos = async (rutaArchivo, procesos) => {
    const extension = node_path_1.default.extname(rutaArchivo).toLowerCase();
    if (extension === ".json") {
        await (0, exports.escribirProcesosAJson)(rutaArchivo, procesos);
        return;
    }
    if (extension === ".csv" || extension === ".txt") {
        await (0, exports.escribirProcesosACsv)(rutaArchivo, procesos);
        return;
    }
    throw new Error(`Formato de archivo no soportado: ${extension}`);
};
exports.guardarProcesos = guardarProcesos;
