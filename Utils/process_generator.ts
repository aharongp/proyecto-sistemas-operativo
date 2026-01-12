import { ProcessInput } from "../Core/process";

export interface ProcessSet {
	name: string;
	description?: string;
	processes: ProcessInput[];
}

export interface RandomGenerationOptions {
	arrivalRange?: [number, number];
	burstRange?: [number, number];
	priorityRange?: [number, number];
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, max));

const createProcess = (
	id: string,
	arrivalTime: number,
	burstTime: number,
	priority: number,
): ProcessInput => ({
	id,
	arrivalTime,
	burstTime,
	priority,
});

const CASE_ONE: ProcessSet = {
	name: "Caso 1 - Procesos Basicos",
	description: "Conjunto base del enunciado con cuatro procesos",
	processes: [
		createProcess("P1", 0, 8, 3),
		createProcess("P2", 1, 4, 1),
		createProcess("P3", 2, 9, 4),
		createProcess("P4", 3, 5, 2),
	],
};

const CASE_TWO: ProcessSet = {
	name: "Caso 2 - Procesos Variados",
	description: "Conjunto mixto con cinco procesos",
	processes: [
		createProcess("P1", 0, 10, 2),
		createProcess("P2", 2, 3, 1),
		createProcess("P3", 4, 6, 3),
		createProcess("P4", 6, 1, 1),
		createProcess("P5", 8, 4, 2),
	],
};

const CASE_THREE: ProcessSet = {
	name: "Caso 3 - Escenario Personal",
	description: "Conjunto editable para experimentos adicionales",
	processes: [
		createProcess("P1", 0, 7, 2),
		createProcess("P2", 1, 5, 4),
		createProcess("P3", 3, 2, 1),
		createProcess("P4", 5, 6, 3),
	],
};

const PREDEFINED_CASES = [CASE_ONE, CASE_TWO, CASE_THREE];

export const getPredefinedCases = () => PREDEFINED_CASES;

export const getPredefinedCase = (name: string) =>
	PREDEFINED_CASES.find((set) => set.name.toLowerCase() === name.toLowerCase());

export const generateRandomProcesses = (
	count: number,
	options: RandomGenerationOptions = {},
): ProcessInput[] => {
	if (count <= 0) {
		return [];
	}

	const [arrivalMin, arrivalMax] = options.arrivalRange ?? [0, 10];
	const [burstMin, burstMax] = options.burstRange ?? [1, 12];
	const [priorityMin, priorityMax] = options.priorityRange ?? [1, 5];

	const processes: ProcessInput[] = [];
	for (let index = 0; index < count; index += 1) {
		const id = `PX${index + 1}`;
		const arrival = Math.floor(Math.random() * (arrivalMax - arrivalMin + 1)) + arrivalMin;
		const burst = Math.floor(Math.random() * (burstMax - burstMin + 1)) + burstMin;
		const priority = Math.floor(Math.random() * (priorityMax - priorityMin + 1)) + priorityMin;
		processes.push(
			createProcess(
				id,
				clamp(arrival, arrivalMin, arrivalMax),
				clamp(burst, burstMin, burstMax),
				clamp(priority, priorityMin, priorityMax),
			),
		);
	}

	return processes.sort((a, b) => {
		if (a.arrivalTime === b.arrivalTime) {
			return a.id.localeCompare(b.id);
		}
		return a.arrivalTime - b.arrivalTime;
	});
};

export const buildCustomCase = (name: string, processes: ProcessInput[], description?: string): ProcessSet => ({
	name,
	description,
	processes,
});

