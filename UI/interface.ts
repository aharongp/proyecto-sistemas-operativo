import { stdin as input, stdout as output } from "node:process";
import { createInterface } from "node:readline/promises";

import {
	SchedulerAlgorithm,
	getAlgorithms,
	runAllSimulations,
	runSimulation,
} from "../Core/scheduler";
import { ProcessInput, SchedulerOptions, SimulationResult } from "../Core/process";
import { printComparison, printSimulationResult } from "./results_display";
import type { ProcessSet } from "../Utils/process_generator";
import { generateRandomProcesses, getPredefinedCases } from "../Utils/process_generator";
import { loadProcesses } from "../Utils/file_handler";

type AlgorithmSelection = {
	mode: "single";
	key: SchedulerAlgorithm;
	options: SchedulerOptions;
} | {
	mode: "all";
	options: Partial<Record<SchedulerAlgorithm, SchedulerOptions>>;
};

const askNumber = async (prompt: string, rl: ReturnType<typeof createInterface>, fallback?: number) => {
	const answer = (await rl.question(prompt)).trim();
	if (answer.length === 0 && fallback !== undefined) {
		return fallback;
	}
	const parsed = Number(answer);
	if (Number.isNaN(parsed)) {
		console.log("Valor no valido, intenta de nuevo.");
		return askNumber(prompt, rl, fallback);
	}
	return parsed;
};

const askBoolean = async (prompt: string, rl: ReturnType<typeof createInterface>, fallback = false) => {
	const answer = (await rl.question(prompt)).trim().toLowerCase();
	if (answer.length === 0) {
		return fallback;
	}
	return ["s", "si", "sí", "y", "yes"].includes(answer);
};

const askProcessesManual = async (rl: ReturnType<typeof createInterface>): Promise<ProcessInput[]> => {
	const count = await askNumber("Cantidad de procesos: ", rl);
	const processes: ProcessInput[] = [];
	for (let index = 0; index < count; index += 1) {
		const id = (await rl.question(`ID proceso ${index + 1}: `)).trim() || `P${index + 1}`;
		const arrivalTime = await askNumber(`Llegada para ${id}: `, rl, 0);
		const burstTime = await askNumber(`Rafaga para ${id}: `, rl);
		const priorityInput = (await rl.question(`Prioridad para ${id} (opcional): `)).trim();
		const priority = priorityInput.length > 0 ? Number(priorityInput) : undefined;
		processes.push({ id, arrivalTime, burstTime, priority });
	}
	return processes;
};

const choosePredefinedCase = async (rl: ReturnType<typeof createInterface>): Promise<ProcessSet> => {
	const cases = getPredefinedCases();
	console.log("\nCasos disponibles:");
	cases.forEach((item, index) => {
		console.log(`${index + 1}. ${item.name} - ${item.description ?? ""}`);
	});
	const choice = await askNumber("Selecciona un caso: ", rl);
	const selected = cases[choice - 1];
	if (!selected) {
		console.log("Opcion invalida, se usara el primer caso.");
		return cases[0];
	}
	return selected;
};

const askProcessSource = async (rl: ReturnType<typeof createInterface>): Promise<ProcessInput[]> => {
	console.log("\nOrigen de procesos:");
	console.log("1. Caso predefinido del proyecto");
	console.log("2. Cargar desde archivo (.json / .csv)");
	console.log("3. Generar aleatoriamente");
	console.log("4. Ingresar manualmente");
	const option = await askNumber("Selecciona opcion: ", rl);

	switch (option) {
		case 1: {
			const selected = await choosePredefinedCase(rl);
			return selected.processes;
		}
		case 2: {
			const path = (await rl.question("Ruta del archivo: ")).trim();
			return loadProcesses(path);
		}
		case 3: {
			const count = await askNumber("Cantidad de procesos a generar: ", rl, 5);
			return generateRandomProcesses(count);
		}
		case 4:
		default:
			return askProcessesManual(rl);
	}
};

const askAlgorithm = async (rl: ReturnType<typeof createInterface>): Promise<AlgorithmSelection> => {
	const algorithms = getAlgorithms();
	console.log("\nAlgoritmos disponibles:");
	console.log("0. Ejecutar todos");
	algorithms.forEach((item, index) => {
		console.log(`${index + 1}. ${item.name}`);
	});

	const choice = await askNumber("Selecciona algoritmo: ", rl, 1);
	if (choice === 0) {
		const options: Partial<Record<SchedulerAlgorithm, SchedulerOptions>> = {};
		const roundRobin = algorithms.find((item) => item.key === SchedulerAlgorithm.RoundRobin);
		if (roundRobin) {
			const needsQuantum = await askBoolean("Deseas cambiar el quantum por defecto (4)? [s/N]: ", rl, false);
			if (needsQuantum) {
				const quantum = await askNumber("Quantum: ", rl, 4);
				options[SchedulerAlgorithm.RoundRobin] = { quantum };
			} else {
				options[SchedulerAlgorithm.RoundRobin] = { quantum: 4 };
			}
		}
		const wantsPreemptive = await askBoolean("Prioridad con desalojo? [s/N]: ", rl, false);
		options[SchedulerAlgorithm.Priority] = { preemptivePriority: wantsPreemptive };
		return { mode: "all", options };
	}

	const selected = algorithms[choice - 1] ?? algorithms[0];
	const options: SchedulerOptions = {};
	if (selected.key === SchedulerAlgorithm.RoundRobin) {
		const quantum = await askNumber("Quantum para Round Robin (default 4): ", rl, 4);
		options.quantum = quantum;
	}
	if (selected.key === SchedulerAlgorithm.Priority) {
		const preemptive = await askBoolean("Deseas habilitar prioridad con desalojo? [s/N]: ", rl, false);
		options.preemptivePriority = preemptive;
	}
	return { mode: "single", key: selected.key, options };
};

const runSimulations = (processes: ProcessInput[], selection: AlgorithmSelection): SimulationResult | SimulationResult[] => {
	if (selection.mode === "single") {
		return runSimulation(selection.key, processes, selection.options);
	}
	return runAllSimulations(processes, selection.options);
};

const presentResults = (outcome: SimulationResult | SimulationResult[]) => {
	if (Array.isArray(outcome)) {
		outcome.forEach((result) => printSimulationResult(result));
		printComparison(outcome);
	} else {
		printSimulationResult(outcome);
	}
};

export const runInteractiveConsole = async () => {
	const rl = createInterface({ input, output });
	console.log("Simulador de Planificacion de CPU");

	try {
		let continueLoop = true;
		while (continueLoop) {
			try {
				const processes = await askProcessSource(rl);
				const selection = await askAlgorithm(rl);
				const outcome = runSimulations(processes, selection);
				presentResults(outcome);
			} catch (error) {
				console.error("Error durante la simulacion:", (error as Error).message);
			}

			continueLoop = await askBoolean("\nDeseas ejecutar otra simulacion? [s/N]: ", rl, false);
		}
	} finally {
		rl.close();
	}
};

export const runOnce = (processes: ProcessInput[], selection: AlgorithmSelection) => {
	const outcome = runSimulations(processes, selection);
	presentResults(outcome);
	return outcome;
};




