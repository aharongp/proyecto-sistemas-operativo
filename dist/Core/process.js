"use strict";
// Definición de tipos básicos para el sistema de simulación de procesos
Object.defineProperty(exports, "__esModule", { value: true });
exports.validarProcesos = exports.ordenarPorLlegada = exports.clonarProceso = exports.EstadoProceso = void 0;
/**
 * Enumeración que representa los estados posibles de un proceso.
 * NUEVO: El proceso se está creando.
 * LISTO: El proceso está listo para ejecutarse.
 * EJECUTANDO: El proceso se está ejecutando.
 * ESPERANDO: El proceso está esperando un evento.
 * TERMINADO: El proceso ha terminado su ejecución.
 */
var EstadoProceso;
(function (EstadoProceso) {
    EstadoProceso["Nuevo"] = "NUEVO";
    EstadoProceso["Listo"] = "LISTO";
    EstadoProceso["Ejecutando"] = "EJECUTANDO";
    EstadoProceso["Esperando"] = "ESPERANDO";
    EstadoProceso["Terminado"] = "TERMINADO";
})(EstadoProceso || (exports.EstadoProceso = EstadoProceso = {}));
/**
 * Función auxiliar para clonar un proceso y crear su traza de ejecución inicial.
 * @param proceso El proceso de entrada.
 * @returns Una nueva instancia de TrazaEjecucionProceso.
 */
const clonarProceso = (proceso) => ({
    proceso: { ...proceso },
    tiemposInicio: [],
    tiempoFinalizacion: null,
    tiempoRestante: proceso.tiempoRafaga,
});
exports.clonarProceso = clonarProceso;
/**
 * Ordena un array de procesos por tiempo de llegada ascendente.
 * En caso de empate, ordena por ID.
 * @param procesos Lista de procesos a ordenar.
 */
const ordenarPorLlegada = (procesos) => [...procesos].sort((a, b) => {
    if (a.tiempoLlegada === b.tiempoLlegada) {
        return a.id.localeCompare(b.id);
    }
    return a.tiempoLlegada - b.tiempoLlegada;
});
exports.ordenarPorLlegada = ordenarPorLlegada;
/**
 * Valida que los procesos tengan valores lógicos (tiempos no negativos, etc.).
 * @param procesos Lista de procesos a validar.
 * @throws Error si algún valor es inválido.
 */
const validarProcesos = (procesos) => {
    procesos.forEach((proc) => {
        if (proc.tiempoLlegada < 0) {
            throw new Error(`El tiempo de llegada debe ser >= 0 para el proceso ${proc.id}`);
        }
        if (proc.tiempoRafaga <= 0) {
            throw new Error(`El tiempo de ráfaga debe ser > 0 para el proceso ${proc.id}`);
        }
        if (proc.prioridad !== undefined && proc.prioridad < 0) {
            throw new Error(`La prioridad debe ser >= 0 para el proceso ${proc.id}`);
        }
    });
};
exports.validarProcesos = validarProcesos;
