"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ejecutarTodasSimulaciones = exports.ejecutarSimulacion = exports.obtenerAlgoritmos = exports.AlgoritmoPlanificacion = void 0;
const metrics_1 = require("./metrics");
const fcfs_1 = __importDefault(require("./algorithms/fcfs"));
const sjf_1 = __importDefault(require("./algorithms/sjf"));
const round_robin_1 = __importDefault(require("./algorithms/round_robin"));
const priority_1 = __importDefault(require("./algorithms/priority"));
const process_1 = require("./process");
/**
 * Enumeración de algoritmos disponibles en el sistema.
 */
var AlgoritmoPlanificacion;
(function (AlgoritmoPlanificacion) {
    AlgoritmoPlanificacion["Fcfs"] = "FCFS";
    AlgoritmoPlanificacion["Sjf"] = "SJF";
    AlgoritmoPlanificacion["RoundRobin"] = "ROUND_ROBIN";
    AlgoritmoPlanificacion["Prioridad"] = "PRIORITY";
})(AlgoritmoPlanificacion || (exports.AlgoritmoPlanificacion = AlgoritmoPlanificacion = {}));
const ALGORITMOS = {
    [AlgoritmoPlanificacion.Fcfs]: {
        clave: AlgoritmoPlanificacion.Fcfs,
        nombre: "First Come First Served (FCFS)",
        ejecutar: fcfs_1.default,
    },
    [AlgoritmoPlanificacion.Sjf]: {
        clave: AlgoritmoPlanificacion.Sjf,
        nombre: "Shortest Job First (SJF)",
        ejecutar: sjf_1.default,
    },
    [AlgoritmoPlanificacion.RoundRobin]: {
        clave: AlgoritmoPlanificacion.RoundRobin,
        nombre: "Round Robin",
        ejecutar: round_robin_1.default,
        requiereQuantum: true,
    },
    [AlgoritmoPlanificacion.Prioridad]: {
        clave: AlgoritmoPlanificacion.Prioridad,
        nombre: "Planificación por Prioridad",
        ejecutar: priority_1.default,
    },
};
/**
 * Obtiene la lista de algoritmos disponibles.
 * @returns Lista de descriptores de algoritmos (sin la función de ejecución).
 */
const obtenerAlgoritmos = () => Object.values(ALGORITMOS).map((algoritmo) => ({
    clave: algoritmo.clave,
    nombre: algoritmo.nombre,
    requiereQuantum: algoritmo.requiereQuantum,
}));
exports.obtenerAlgoritmos = obtenerAlgoritmos;
/**
 * Ejecuta una simulación con un algoritmo específico.
 *
 * @param algoritmo Clave del algoritmo a ejecutar.
 * @param procesos Lista de procesos de entrada.
 * @param opciones Opciones específicas para el algoritmo (quantum, expropiación, etc.).
 * @returns Resultados completos de la simulación.
 */
const ejecutarSimulacion = (algoritmo, procesos, opciones = {}) => {
    (0, process_1.validarProcesos)(procesos);
    const descriptor = ALGORITMOS[algoritmo];
    if (!descriptor) {
        throw new Error(`Algoritmo desconocido: ${algoritmo}`);
    }
    const { trazas, intervalos, tiempoTotal, tiempoOcioso } = descriptor.ejecutar(procesos, opciones);
    const { metricas, resumen } = (0, metrics_1.calcularMetricas)({ trazas, tiempoTotal, tiempoOcioso, intervalos });
    return {
        algoritmo: descriptor.nombre,
        intervalos,
        metricas,
        resumen,
        tiempoTotal,
        tiempoOcioso,
        opciones,
    };
};
exports.ejecutarSimulacion = ejecutarSimulacion;
/**
 * Ejecuta simulaciones para todos los algoritmos disponibles.
 *
 * @param procesos Lista de procesos de entrada.
 * @param opciones Mapa de opciones por algoritmo.
 * @returns Lista de resultados de simulación.
 */
const ejecutarTodasSimulaciones = (procesos, opciones = {}) => (0, exports.obtenerAlgoritmos)().map((algoritmo) => (0, exports.ejecutarSimulacion)(algoritmo.clave, procesos, opciones[algoritmo.clave] ?? {}));
exports.ejecutarTodasSimulaciones = ejecutarTodasSimulaciones;
