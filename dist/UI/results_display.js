"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.imprimirComparativa = exports.imprimirResultadoSimulacion = void 0;
const formatearNumero = (valor) => valor.toFixed(2).padStart(7, " ");
const renderizarFilaProceso = (metric) => [
    metric.idProceso.padEnd(6, " "),
    metric.tiempoLlegada.toString().padStart(6, " "),
    metric.tiempoRafaga.toString().padStart(6, " "),
    (metric.prioridad ?? "-").toString().padStart(9, " "),
    metric.tiempoFinalizacion.toString().padStart(10, " "),
    formatearNumero(metric.tiempoRetorno),
    formatearNumero(metric.tiempoEspera),
    formatearNumero(metric.tiempoRespuesta),
].join("  ");
const renderizarLineaTiempo = (resultado) => {
    if (resultado.intervalos.length === 0) {
        return "Sin ejecucion";
    }
    const segmentos = resultado.intervalos.map((intervalo) => {
        const etiqueta = intervalo.idProceso.padEnd(4, " ");
        return `${intervalo.tiempoInicio}|${etiqueta}|${intervalo.tiempoFin}`;
    });
    return segmentos.join(" -- ");
};
/**
 * Imprime en consola el resultado detallado de una simulación.
 */
const imprimirResultadoSimulacion = (resultado) => {
    console.log(`\n=== ${resultado.algoritmo} ===`);
    console.log("Procesos:");
    console.log([
        "ID".padEnd(6, " "),
        "Llegada".padStart(6, " "),
        "Rafaga".padStart(6, " "),
        "Prioridad".padStart(9, " "),
        "Finaliza".padStart(10, " "),
        "T.Ret".padStart(7, " "),
        "T.Esp".padStart(7, " "),
        "T.Res".padStart(7, " "),
    ].join("  "));
    resultado.metricas.forEach((metrica) => console.log(renderizarFilaProceso(metrica)));
    console.log("\nResumen:");
    console.log(`Total tiempo     : ${formatearNumero(resultado.tiempoTotal)}`);
    console.log(`Tiempo ocioso    : ${formatearNumero(resultado.tiempoOcioso)}`);
    console.log(`Promedio Retorno : ${formatearNumero(resultado.resumen.promedioRetorno)}`);
    console.log(`Promedio Espera  : ${formatearNumero(resultado.resumen.promedioEspera)}`);
    console.log(`Promedio Respuesta: ${formatearNumero(resultado.resumen.promedioRespuesta)}`);
    console.log(`Utilizacion CPU  : ${formatearNumero(resultado.resumen.utilizacionCpu)} %`);
    console.log(`Rendimiento      : ${formatearNumero(resultado.resumen.rendimiento)}`);
    console.log("\nDiagrama Gantt (texto):");
    console.log(renderizarLineaTiempo(resultado));
};
exports.imprimirResultadoSimulacion = imprimirResultadoSimulacion;
const encontrarMejorAlgoritmo = (resultados) => {
    if (resultados.length === 0) {
        return undefined;
    }
    return resultados.reduce((mejor, actual) => {
        if (!mejor) {
            return actual;
        }
        // Criterio principal: menor tiempo de espera promedio
        if (actual.resumen.promedioEspera < mejor.resumen.promedioEspera) {
            return actual;
        }
        // Empate: menor tiempo de retorno promedio
        if (actual.resumen.promedioEspera === mejor.resumen.promedioEspera) {
            return actual.resumen.promedioRetorno < mejor.resumen.promedioRetorno ? actual : mejor;
        }
        return mejor;
    });
};
/**
 * Imprime una tabla comparativa de múltiples simulaciones.
 */
const imprimirComparativa = (resultados) => {
    if (resultados.length === 0) {
        console.log("Sin resultados para comparar");
        return;
    }
    console.log("\n=== Comparativa de algoritmos ===");
    console.log([
        "Algoritmo".padEnd(28, " "),
        "T.Ret Prom".padStart(12, " "),
        "T.Esp Prom".padStart(12, " "),
        "T.Res Prom".padStart(12, " "),
        "CPU %".padStart(8, " "),
        "Rendimiento".padStart(12, " "),
    ].join("  "));
    resultados.forEach((res) => {
        console.log([
            res.algoritmo.padEnd(28, " "),
            formatearNumero(res.resumen.promedioRetorno),
            formatearNumero(res.resumen.promedioEspera),
            formatearNumero(res.resumen.promedioRespuesta),
            formatearNumero(res.resumen.utilizacionCpu),
            formatearNumero(res.resumen.rendimiento),
        ].join("  "));
    });
    const mejor = encontrarMejorAlgoritmo(resultados);
    if (mejor) {
        console.log(`\nMejor opcion segun T.Esp promedio: ${mejor.algoritmo}`);
    }
};
exports.imprimirComparativa = imprimirComparativa;
