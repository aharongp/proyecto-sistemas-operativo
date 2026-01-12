"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runOnce = exports.runInteractiveConsole = exports.ejecutarUnaVez = exports.ejecutarConsolaInteractiva = void 0;
const node_process_1 = require("node:process");
const promises_1 = require("node:readline/promises");
const scheduler_1 = require("../Core/scheduler");
const results_display_1 = require("./results_display");
const process_generator_1 = require("../Utils/process_generator");
const file_handler_1 = require("../Utils/file_handler");
/**
 * Solicita al usuario un número y maneja la validación básica.
 */
const solicitarNumero = async (mensaje, rl, respaldo) => {
    const respuesta = (await rl.question(mensaje)).trim();
    if (respuesta.length === 0 && respaldo !== undefined) {
        return respaldo;
    }
    const parseado = Number(respuesta);
    if (Number.isNaN(parseado)) {
        console.log("Valor no válido, intenta de nuevo.");
        return solicitarNumero(mensaje, rl, respaldo);
    }
    return parseado;
};
/**
 * Solicita una respuesta afirmativa/negativa con soporte a valores por defecto.
 */
const solicitarBooleano = async (mensaje, rl, respaldo = false) => {
    const respuesta = (await rl.question(mensaje)).trim().toLowerCase();
    if (respuesta.length === 0) {
        return respaldo;
    }
    return ["s", "si", "sí", "y", "yes"].includes(respuesta);
};
/**
 * Permite capturar procesos de manera manual desde consola.
 */
const solicitarProcesosManual = async (rl) => {
    const cantidad = await solicitarNumero("Cantidad de procesos: ", rl);
    const procesos = [];
    for (let indice = 0; indice < cantidad; indice += 1) {
        const id = (await rl.question(`ID proceso ${indice + 1}: `)).trim() || `P${indice + 1}`;
        const tiempoLlegada = await solicitarNumero(`Llegada para ${id}: `, rl, 0);
        const tiempoRafaga = await solicitarNumero(`Ráfaga para ${id}: `, rl);
        const textoPrioridad = (await rl.question(`Prioridad para ${id} (opcional): `)).trim();
        const prioridad = textoPrioridad.length > 0 ? Number(textoPrioridad) : undefined;
        procesos.push({ id, tiempoLlegada, tiempoRafaga, prioridad });
    }
    return procesos;
};
/**
 * Muestra los casos predefinidos y permite elegir uno.
 */
const elegirCasoPredefinido = async (rl) => {
    const casos = (0, process_generator_1.obtenerCasosPredefinidos)();
    console.log("\nCasos disponibles:");
    casos.forEach((caso, indice) => {
        console.log(`${indice + 1}. ${caso.nombre} - ${caso.descripcion ?? ""}`);
    });
    const seleccion = await solicitarNumero("Selecciona un caso: ", rl);
    const elegido = casos[seleccion - 1];
    if (!elegido) {
        console.log("Opción inválida, se usará el primer caso.");
        return casos[0];
    }
    return elegido;
};
/**
 * Determina el origen de los procesos para una simulación.
 */
const solicitarFuenteProcesos = async (rl) => {
    console.log("\nOrigen de procesos:");
    console.log("1. Caso predefinido del proyecto");
    console.log("2. Cargar desde archivo (.json / .csv)");
    console.log("3. Generar aleatoriamente");
    console.log("4. Ingresar manualmente");
    const opcion = await solicitarNumero("Selecciona opción: ", rl);
    switch (opcion) {
        case 1: {
            const caso = await elegirCasoPredefinido(rl);
            return caso.procesos;
        }
        case 2: {
            const ruta = (await rl.question("Ruta del archivo: ")).trim();
            return (0, file_handler_1.cargarProcesos)(ruta);
        }
        case 3: {
            const cantidad = await solicitarNumero("Cantidad de procesos a generar: ", rl, 5);
            return (0, process_generator_1.generarProcesosAleatorios)(cantidad);
        }
        case 4:
        default:
            return solicitarProcesosManual(rl);
    }
};
/**
 * Solicita el algoritmo a ejecutar y sus opciones asociadas.
 */
const solicitarAlgoritmo = async (rl) => {
    const algoritmos = (0, scheduler_1.obtenerAlgoritmos)();
    console.log("\nAlgoritmos disponibles:");
    console.log("0. Ejecutar todos");
    algoritmos.forEach((algoritmo, indice) => {
        console.log(`${indice + 1}. ${algoritmo.nombre}`);
    });
    const seleccion = await solicitarNumero("Selecciona algoritmo: ", rl, 1);
    if (seleccion === 0) {
        const opciones = {};
        const roundRobin = algoritmos.find((algoritmo) => algoritmo.clave === scheduler_1.AlgoritmoPlanificacion.RoundRobin);
        if (roundRobin) {
            const cambiarQuantum = await solicitarBooleano("¿Deseas cambiar el quantum por defecto (4)? [s/N]: ", rl, false);
            const quantum = cambiarQuantum ? await solicitarNumero("Quantum: ", rl, 4) : 4;
            opciones[scheduler_1.AlgoritmoPlanificacion.RoundRobin] = { quantum };
        }
        const prioridadExpropiativa = await solicitarBooleano("¿Prioridad con desalojo? [s/N]: ", rl, false);
        opciones[scheduler_1.AlgoritmoPlanificacion.Prioridad] = { prioridadExpropiativa };
        return { modo: "todos", opciones };
    }
    const algoritmoSeleccionado = algoritmos[seleccion - 1] ?? algoritmos[0];
    const opciones = {};
    if (algoritmoSeleccionado.clave === scheduler_1.AlgoritmoPlanificacion.RoundRobin) {
        opciones.quantum = await solicitarNumero("Quantum para Round Robin (default 4): ", rl, 4);
    }
    if (algoritmoSeleccionado.clave === scheduler_1.AlgoritmoPlanificacion.Prioridad) {
        opciones.prioridadExpropiativa = await solicitarBooleano("¿Deseas habilitar prioridad con desalojo? [s/N]: ", rl, false);
    }
    return { modo: "uno", clave: algoritmoSeleccionado.clave, opciones };
};
/**
 * Ejecuta la simulación según la selección indicada.
 */
const ejecutarSegunSeleccion = (procesos, seleccion) => {
    if (seleccion.modo === "uno") {
        return (0, scheduler_1.ejecutarSimulacion)(seleccion.clave, procesos, seleccion.opciones);
    }
    return (0, scheduler_1.ejecutarTodasSimulaciones)(procesos, seleccion.opciones);
};
/**
 * Muestra los resultados en consola ya sea de una o múltiples simulaciones.
 */
const mostrarResultados = (resultado) => {
    if (Array.isArray(resultado)) {
        resultado.forEach((item) => (0, results_display_1.imprimirResultadoSimulacion)(item));
        (0, results_display_1.imprimirComparativa)(resultado);
    }
    else {
        (0, results_display_1.imprimirResultadoSimulacion)(resultado);
    }
};
/**
 * Punto de entrada para la experiencia interactiva por consola.
 */
const ejecutarConsolaInteractiva = async () => {
    const rl = (0, promises_1.createInterface)({ input: node_process_1.stdin, output: node_process_1.stdout });
    console.log("Simulador de Planificación de CPU");
    try {
        let continuar = true;
        while (continuar) {
            try {
                const procesos = await solicitarFuenteProcesos(rl);
                const seleccion = await solicitarAlgoritmo(rl);
                const resultado = ejecutarSegunSeleccion(procesos, seleccion);
                mostrarResultados(resultado);
            }
            catch (error) {
                console.error("Error durante la simulación:", error.message);
            }
            continuar = await solicitarBooleano("\n¿Deseas ejecutar otra simulación? [s/N]: ", rl, false);
        }
    }
    finally {
        rl.close();
    }
};
exports.ejecutarConsolaInteractiva = ejecutarConsolaInteractiva;
/**
 * Ejecuta la consola en modo no interactivo (útil para pruebas automatizadas).
 */
const ejecutarUnaVez = (procesos, seleccion) => {
    const resultado = ejecutarSegunSeleccion(procesos, seleccion);
    mostrarResultados(resultado);
    return resultado;
};
exports.ejecutarUnaVez = ejecutarUnaVez;
// Alias en inglés para compatibilidad con scripts anteriores
exports.runInteractiveConsole = exports.ejecutarConsolaInteractiva;
exports.runOnce = exports.ejecutarUnaVez;
