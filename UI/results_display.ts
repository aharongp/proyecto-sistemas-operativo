import { SimulationResult } from "../Core/process";

const formatNumber = (value: number) => value.toFixed(2).padStart(7, " ");

const renderProcessRow = (metric: SimulationResult["metrics"][number]) =>
	[
		metric.processId.padEnd(6, " "),
		metric.arrivalTime.toString().padStart(6, " "),
		metric.burstTime.toString().padStart(6, " "),
		(metric.priority ?? "-").toString().padStart(8, " "),
		metric.completionTime.toString().padStart(10, " "),
		formatNumber(metric.turnaroundTime),
		formatNumber(metric.waitingTime),
		formatNumber(metric.responseTime),
	].join("  ");

const renderTimeline = (result: SimulationResult) => {
	if (result.slices.length === 0) {
		return "Sin ejecucion";
	}

	const segments = result.slices.map((slice) => {
		const label = slice.processId.padEnd(4, " ");
		return `${slice.startTime}|${label}|${slice.endTime}`;
	});
	return segments.join(" -- ");
};

export const printSimulationResult = (result: SimulationResult) => {
	console.log(`\n=== ${result.algorithm} ===`);
	console.log("Procesos:");
	console.log(
		[
			"ID".padEnd(6, " "),
			"Llegada".padStart(6, " "),
			"Rafaga".padStart(6, " "),
			"Prioridad".padStart(8, " "),
			"Finaliza".padStart(10, " "),
			"T.Ret".padStart(7, " "),
			"T.Esp".padStart(7, " "),
			"T.Res".padStart(7, " "),
		].join("  "),
	);
	result.metrics.forEach((metric) => console.log(renderProcessRow(metric)));

	console.log("\nResumen:");
	console.log(`Total tiempo   : ${formatNumber(result.totalTime)}`);
	console.log(`Tiempo inactivo: ${formatNumber(result.idleTime)}`);
	console.log(`Promedio Retorno : ${formatNumber(result.summary.averageTurnaround)}`);
	console.log(`Promedio Espera  : ${formatNumber(result.summary.averageWaiting)}`);
	console.log(`Promedio Respuesta: ${formatNumber(result.summary.averageResponse)}`);
	console.log(`Utilizacion CPU  : ${formatNumber(result.summary.cpuUtilization)} %`);
	console.log(`Throughput       : ${formatNumber(result.summary.throughput)}`);

	console.log("\nDiagrama Gantt (texto):");
	console.log(renderTimeline(result));
};

const findBestAlgorithm = (results: SimulationResult[]) => {
	if (results.length === 0) {
		return undefined;
	}
	return results.reduce((best, current) => {
		if (!best) {
			return current;
		}
		if (current.summary.averageWaiting < best.summary.averageWaiting) {
			return current;
		}
		if (current.summary.averageWaiting === best.summary.averageWaiting) {
			return current.summary.averageTurnaround < best.summary.averageTurnaround ? current : best;
		}
		return best;
	});
};

export const printComparison = (results: SimulationResult[]) => {
	if (results.length === 0) {
		console.log("Sin resultados para comparar");
		return;
	}

	console.log("\n=== Comparativa de algoritmos ===");
	console.log(
		[
			"Algoritmo".padEnd(26, " "),
			"T.Ret Prom".padStart(12, " "),
			"T.Esp Prom".padStart(12, " "),
			"T.Res Prom".padStart(12, " "),
			"CPU %".padStart(8, " "),
			"Throughput".padStart(12, " "),
		].join("  "),
	);

	results.forEach((result) => {
		console.log(
			[
				result.algorithm.padEnd(26, " "),
				formatNumber(result.summary.averageTurnaround),
				formatNumber(result.summary.averageWaiting),
				formatNumber(result.summary.averageResponse),
				formatNumber(result.summary.cpuUtilization),
				formatNumber(result.summary.throughput),
			].join("  "),
		);
	});

	const best = findBestAlgorithm(results);
	if (best) {
		console.log(`\nMejor opcion segun T.Esp promedio: ${best.algorithm}`);
	}
};

