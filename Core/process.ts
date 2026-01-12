export type ProcessId = string;

export enum ProcessState {
	New = "NEW",
	Ready = "READY",
	Running = "RUNNING",
	Waiting = "WAITING",
	Terminated = "TERMINATED",
}

export interface ProcessInput {
	id: ProcessId;
	arrivalTime: number;
	burstTime: number;
	priority?: number;
}

export interface SchedulerOptions {
	quantum?: number;
	preemptivePriority?: boolean;
}

export interface ScheduledSlice {
	processId: ProcessId;
	startTime: number;
	endTime: number;
}

export interface ProcessExecutionTrace {
	process: ProcessInput;
	startTimes: number[];
	completionTime: number | null;
	remainingTime: number;
}

export interface ProcessMetrics {
	processId: ProcessId;
	arrivalTime: number;
	burstTime: number;
	priority?: number;
	completionTime: number;
	turnaroundTime: number;
	waitingTime: number;
	responseTime: number;
}

export interface SimulationSummary {
	averageTurnaround: number;
	averageWaiting: number;
	averageResponse: number;
	cpuUtilization: number;
	throughput: number;
}

export interface SimulationResult {
	algorithm: string;
	slices: ScheduledSlice[];
	metrics: ProcessMetrics[];
	summary: SimulationSummary;
	totalTime: number;
	idleTime: number;
	options: SchedulerOptions;
}

export const cloneProcess = (process: ProcessInput): ProcessExecutionTrace => ({
	process: { ...process },
	startTimes: [],
	completionTime: null,
	remainingTime: process.burstTime,
});

export const sortByArrival = (processes: ProcessInput[]): ProcessInput[] =>
	[...processes].sort((a, b) => {
		if (a.arrivalTime === b.arrivalTime) {
			return a.id.localeCompare(b.id);
		}
		return a.arrivalTime - b.arrivalTime;
	});

export const validateProcesses = (processes: ProcessInput[]): void => {
	processes.forEach((proc) => {
		if (proc.arrivalTime < 0) {
			throw new Error(`Arrival time must be >= 0 for process ${proc.id}`);
		}
		if (proc.burstTime <= 0) {
			throw new Error(`Burst time must be > 0 for process ${proc.id}`);
		}
		if (proc.priority !== undefined && proc.priority < 0) {
			throw new Error(`Priority must be >= 0 for process ${proc.id}`);
		}
	});
}

