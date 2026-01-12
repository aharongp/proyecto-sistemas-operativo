import { calculateMetrics } from "./metrics";
import fcfs from "./algorithms/fcfs";
import sjf from "./algorithms/sjf";
import roundRobin from "./algorithms/round_robin";
import priority from "./algorithms/priority";
import {
	ProcessInput,
	SchedulerOptions,
	SimulationResult,
	validateProcesses,
} from "./process";
import { AlgorithmImplementation } from "./algorithms/types";

export enum SchedulerAlgorithm {
	Fcfs = "FCFS",
	Sjf = "SJF",
	RoundRobin = "ROUND_ROBIN",
	Priority = "PRIORITY",
}

interface AlgorithmDescriptor {
	key: SchedulerAlgorithm;
	name: string;
	run: AlgorithmImplementation;
	requiresQuantum?: boolean;
}

const ALGORITHMS: Record<SchedulerAlgorithm, AlgorithmDescriptor> = {
	[SchedulerAlgorithm.Fcfs]: {
		key: SchedulerAlgorithm.Fcfs,
		name: "First Come First Served",
		run: fcfs,
	},
	[SchedulerAlgorithm.Sjf]: {
		key: SchedulerAlgorithm.Sjf,
		name: "Shortest Job First",
		run: sjf,
	},
	[SchedulerAlgorithm.RoundRobin]: {
		key: SchedulerAlgorithm.RoundRobin,
		name: "Round Robin",
		run: roundRobin,
		requiresQuantum: true,
	},
	[SchedulerAlgorithm.Priority]: {
		key: SchedulerAlgorithm.Priority,
		name: "Priority Scheduling",
		run: priority,
	},
};

export const getAlgorithms = () => Object.values(ALGORITHMS).map((algorithm) => ({
	key: algorithm.key,
	name: algorithm.name,
	requiresQuantum: algorithm.requiresQuantum,
}));

export const runSimulation = (
	algorithm: SchedulerAlgorithm,
	processes: ProcessInput[],
	options: SchedulerOptions = {},
): SimulationResult => {
	validateProcesses(processes);
	const descriptor = ALGORITHMS[algorithm];
	if (!descriptor) {
		throw new Error(`Unknown algorithm ${algorithm}`);
	}

	const { traces, slices, totalTime, idleTime } = descriptor.run(processes, options);
	const { metrics, summary } = calculateMetrics({ traces, totalTime, idleTime, slices });

	return {
		algorithm: descriptor.name,
		slices,
		metrics,
		summary,
		totalTime,
		idleTime,
		options,
	};
};

export const runAllSimulations = (
	processes: ProcessInput[],
	options: Partial<Record<SchedulerAlgorithm, SchedulerOptions>> = {},
) =>
	getAlgorithms().map((algorithm) =>
		runSimulation(algorithm.key, processes, options[algorithm.key] ?? {}),
	);

