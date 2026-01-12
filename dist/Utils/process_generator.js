"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.construirCasoPersonalizado = exports.generarProcesosAleatorios = exports.obtenerCasoPredefinido = exports.obtenerCasosPredefinidos = void 0;
const limitar = (valor, min, max) => Math.max(min, Math.min(valor, max));
const crearProceso = (id, tiempoLlegada, tiempoRafaga, prioridad) => ({
    id,
    tiempoLlegada,
    tiempoRafaga,
    prioridad,
});
const CASO_UNO = {
    nombre: "Caso 1 - Procesos Basicos",
    descripcion: "Conjunto base del enunciado con cuatro procesos",
    procesos: [
        crearProceso("P1", 0, 8, 3),
        crearProceso("P2", 1, 4, 1),
        crearProceso("P3", 2, 9, 4),
        crearProceso("P4", 3, 5, 2),
    ],
};
const CASO_DOS = {
    nombre: "Caso 2 - Procesos Variados",
    descripcion: "Conjunto mixto con cinco procesos",
    procesos: [
        crearProceso("P1", 0, 10, 2),
        crearProceso("P2", 2, 3, 1),
        crearProceso("P3", 4, 6, 3),
        crearProceso("P4", 6, 1, 1),
        crearProceso("P5", 8, 4, 2),
    ],
};
const CASO_TRES = {
    nombre: "Caso 3 - Escenario Personal",
    descripcion: "Conjunto editable para experimentos adicionales",
    procesos: [
        crearProceso("P1", 0, 7, 2),
        crearProceso("P2", 1, 5, 4),
        crearProceso("P3", 3, 2, 1),
        crearProceso("P4", 5, 6, 3),
    ],
};
const CASOS_PREDEFINIDOS = [CASO_UNO, CASO_DOS, CASO_TRES];
/**
 * Retorna todos los casos de prueba predefinidos.
 */
const obtenerCasosPredefinidos = () => CASOS_PREDEFINIDOS;
exports.obtenerCasosPredefinidos = obtenerCasosPredefinidos;
/**
 * Busca un caso predefinido por nombre.
 */
const obtenerCasoPredefinido = (nombre) => CASOS_PREDEFINIDOS.find((set) => set.nombre.toLowerCase() === nombre.toLowerCase());
exports.obtenerCasoPredefinido = obtenerCasoPredefinido;
/**
 * Genera una lista de procesos aleatorios según las opciones dadas.
 *
 * @param cantidad Número de procesos a generar.
 * @param opciones Rangos de valores.
 * @returns Lista de procesos ordenados por llegada.
 */
const generarProcesosAleatorios = (cantidad, opciones = {}) => {
    if (cantidad <= 0) {
        return [];
    }
    const [llegadaMin, llegadaMax] = opciones.rangoLlegada ?? [0, 10];
    const [rafagaMin, rafagaMax] = opciones.rangoRafaga ?? [1, 12];
    const [prioridadMin, prioridadMax] = opciones.rangoPrioridad ?? [1, 5];
    const procesos = [];
    for (let i = 0; i < cantidad; i += 1) {
        const id = `PX${i + 1}`;
        const llegada = Math.floor(Math.random() * (llegadaMax - llegadaMin + 1)) + llegadaMin;
        const rafaga = Math.floor(Math.random() * (rafagaMax - rafagaMin + 1)) + rafagaMin;
        const prioridad = Math.floor(Math.random() * (prioridadMax - prioridadMin + 1)) + prioridadMin;
        procesos.push(crearProceso(id, limitar(llegada, llegadaMin, llegadaMax), limitar(rafaga, rafagaMin, rafagaMax), limitar(prioridad, prioridadMin, prioridadMax)));
    }
    return procesos.sort((a, b) => {
        if (a.tiempoLlegada === b.tiempoLlegada) {
            return a.id.localeCompare(b.id);
        }
        return a.tiempoLlegada - b.tiempoLlegada;
    });
};
exports.generarProcesosAleatorios = generarProcesosAleatorios;
/**
 * Construye un objeto ConjuntoProcesos personalizado.
 */
const construirCasoPersonalizado = (nombre, procesos, descripcion) => ({
    nombre,
    descripcion,
    procesos,
});
exports.construirCasoPersonalizado = construirCasoPersonalizado;
