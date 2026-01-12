"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const process_1 = require("../process");
const obtenerPrioridad = (proceso) => proceso.prioridad ?? Number.MAX_SAFE_INTEGER;
/**
 * Selecciona el proceso con mayor prioridad de la lista de listos.
 * Menor valor numérico = Mayor prioridad.
 * Desempate: FCFS.
 */
const seleccionarMayorPrioridad = (listos) => {
    const ordenados = [...listos].sort((a, b) => {
        const diffPrioridad = obtenerPrioridad(a.proceso) - obtenerPrioridad(b.proceso);
        if (diffPrioridad !== 0) {
            return diffPrioridad;
        }
        if (a.proceso.tiempoLlegada === b.proceso.tiempoLlegada) {
            return a.proceso.id.localeCompare(b.proceso.id);
        }
        return a.proceso.tiempoLlegada - b.proceso.tiempoLlegada;
    });
    return ordenados[0];
};
const encolarLlegadas = (ordenados, indice, tiempoActual, colaListos, trazaPorId) => {
    while (indice.valor < ordenados.length && ordenados[indice.valor].tiempoLlegada <= tiempoActual) {
        const entrando = ordenados[indice.valor];
        const traza = trazaPorId.get(entrando.id);
        if (!traza) {
            throw new Error(`Falta traza para el proceso ${entrando.id}`);
        }
        colaListos.push(traza);
        indice.valor += 1;
    }
};
const actualizarIntervalos = (intervalos, idProceso, tiempoInicio, tiempoFin) => {
    const ultimo = intervalos[intervalos.length - 1];
    // Si el último intervalo es del mismo proceso y continuo, lo extendemos
    if (ultimo && ultimo.idProceso === idProceso && ultimo.tiempoFin === tiempoInicio) {
        ultimo.tiempoFin = tiempoFin;
        return;
    }
    intervalos.push({ idProceso, tiempoInicio, tiempoFin });
};
const ejecutarPrioridadInterno = (procesos, expropiativo) => {
    const ordenados = [...procesos].sort((a, b) => {
        if (a.tiempoLlegada === b.tiempoLlegada) {
            return a.id.localeCompare(b.id);
        }
        return a.tiempoLlegada - b.tiempoLlegada;
    });
    const trazas = ordenados.map((proc) => (0, process_1.clonarProceso)(proc));
    const trazaPorId = new Map(trazas.map((traza) => [traza.proceso.id, traza]));
    const listos = [];
    const intervalos = [];
    const indice = { valor: 0 };
    let tiempoActual = 0;
    let tiempoOcioso = 0;
    if (ordenados.length === 0) {
        return { intervalos, trazas, tiempoTotal: 0, tiempoOcioso: 0 };
    }
    // Avanzar al primer proceso
    tiempoActual = Math.min(...ordenados.map((proc) => proc.tiempoLlegada));
    encolarLlegadas(ordenados, indice, tiempoActual, listos, trazaPorId);
    while (listos.length > 0 || indice.valor < ordenados.length) {
        // Si no hay procesos listos, avanzamos el tiempo (ocio)
        if (listos.length === 0) {
            const proximaLlegada = ordenados[indice.valor].tiempoLlegada;
            tiempoOcioso += proximaLlegada - tiempoActual;
            tiempoActual = proximaLlegada;
            encolarLlegadas(ordenados, indice, tiempoActual, listos, trazaPorId);
            continue;
        }
        const seleccionado = seleccionarMayorPrioridad(listos);
        const indiceCola = listos.findIndex((proc) => proc.proceso.id === seleccionado.proceso.id);
        listos.splice(indiceCola, 1);
        if (seleccionado.tiempoRestante <= 0) {
            continue;
        }
        // Registrar inicio si es discontinuo o inicio
        if (seleccionado.tiemposInicio.length === 0 ||
            seleccionado.tiemposInicio[seleccionado.tiemposInicio.length - 1] !== tiempoActual) {
            seleccionado.tiemposInicio.push(tiempoActual);
        }
        const proximaLlegada = indice.valor < ordenados.length ? ordenados[indice.valor].tiempoLlegada : Infinity;
        let duracionEjecucion = seleccionado.tiempoRestante;
        // Si es expropiativo, verificamos si alguien llega antes de terminar
        if (expropiativo && proximaLlegada > tiempoActual) {
            duracionEjecucion = Math.min(duracionEjecucion, proximaLlegada - tiempoActual);
            if (!Number.isFinite(duracionEjecucion) || duracionEjecucion <= 0) {
                duracionEjecucion = seleccionado.tiempoRestante;
            }
        }
        const tiempoFin = tiempoActual + duracionEjecucion;
        seleccionado.tiempoRestante -= duracionEjecucion;
        if (seleccionado.tiempoRestante < 0) {
            seleccionado.tiempoRestante = 0;
        }
        actualizarIntervalos(intervalos, seleccionado.proceso.id, tiempoActual, tiempoFin);
        tiempoActual = tiempoFin;
        // Procesar nuevas llegadas durante este tiempo
        encolarLlegadas(ordenados, indice, tiempoActual, listos, trazaPorId);
        if (seleccionado.tiempoRestante === 0) {
            seleccionado.tiempoFinalizacion = tiempoActual;
        }
        else {
            // Volver a la cola si no terminó (expropiado)
            listos.push(seleccionado);
            if (!expropiativo) {
                // Seguridad: no debería pasar en no expropiativo
                seleccionado.tiempoFinalizacion = tiempoActual;
                seleccionado.tiempoRestante = 0;
            }
        }
    }
    return {
        intervalos,
        trazas,
        tiempoTotal: tiempoActual,
        tiempoOcioso,
    };
};
/**
 * Implementación del algoritmo de Prioridad.
 * Soporta modo expropiativo y no expropiativo.
 */
const ejecutarPrioridad = (procesos, opciones = {}) => {
    const expropiativo = opciones.prioridadExpropiativa ?? false;
    return ejecutarPrioridadInterno(procesos, expropiativo);
};
exports.default = ejecutarPrioridad;
