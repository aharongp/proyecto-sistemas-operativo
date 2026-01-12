import {
	ProcessExecutionTrace,
	ProcessMetrics,
	ScheduledSlice,
	SimulationSummary,
} from "./process";

export interface MetricsInput {
	traces: ProcessExecutionTrace[];
	slices: ScheduledSlice[];
	totalTime: number;
	idleTime: number;
}

export const buildProcessMetrics = (
	traces: ProcessExecutionTrace[],
): ProcessMetrics[] => {
	return traces.map((trace) => {
		if (trace.completionTime === null) {
			throw new Error(`Process ${trace.process.id} never completed`);
		}
		const firstStart = trace.startTimes.length > 0 ? trace.startTimes[0] : trace.process.arrivalTime;
		const turnaroundTime = trace.completionTime - trace.process.arrivalTime;
		const waitingTime = turnaroundTime - trace.process.burstTime;
		const responseTime = firstStart - trace.process.arrivalTime;

		return {
			processId: trace.process.id,
			arrivalTime: trace.process.arrivalTime,
			burstTime: trace.process.burstTime,
			priority: trace.process.priority,
			completionTime: trace.completionTime,
			turnaroundTime,
			waitingTime,
			responseTime,
		};
	});
};

export const buildSummaryMetrics = (
	processes: ProcessMetrics[],
	totalTime: number,
	idleTime: number,
): SimulationSummary => {
	const count = processes.length;
	const sumTurnaround = processes.reduce((acc, proc) => acc + proc.turnaroundTime, 0);
	const sumWaiting = processes.reduce((acc, proc) => acc + proc.waitingTime, 0);
	const sumResponse = processes.reduce((acc, proc) => acc + proc.responseTime, 0);
	const busyTime = Math.max(totalTime - idleTime, 0);
	const averageTurnaround = count > 0 ? sumTurnaround / count : 0;
	const averageWaiting = count > 0 ? sumWaiting / count : 0;
	const averageResponse = count > 0 ? sumResponse / count : 0;
	const cpuUtilization = totalTime > 0 ? (busyTime / totalTime) * 100 : 0;
	const throughput = totalTime > 0 ? count / totalTime : 0;

	return {
		averageTurnaround,
		averageWaiting,
		averageResponse,
		cpuUtilization,
		throughput,
	};
};

export const calculateMetrics = ({ traces, totalTime, idleTime }: MetricsInput) => {
	const metrics = buildProcessMetrics(traces);
	const summary = buildSummaryMetrics(metrics, totalTime, idleTime);
	return { metrics, summary };
};

