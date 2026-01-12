import { cloneProcess, ProcessExecutionTrace, ProcessInput, ScheduledSlice } from "../process";
import { AlgorithmImplementation } from "./types";

const enqueueArrivals = (
	ordered: ProcessInput[],
	index: { value: number },
	currentTime: number,
	queue: ProcessExecutionTrace[],
	traceById: Map<string, ProcessExecutionTrace>,
) => {
	while (index.value < ordered.length && ordered[index.value].arrivalTime <= currentTime) {
		const arriving = ordered[index.value];
		const trace = traceById.get(arriving.id);
		if (!trace) {
			throw new Error(`Missing runtime trace for process ${arriving.id}`);
		}
		queue.push(trace);
		index.value += 1;
	}
};

const runRoundRobin: AlgorithmImplementation = (processes, options) => {
	const quantum = options?.quantum ?? 2;
	if (quantum <= 0) {
		throw new Error("Round Robin requires quantum > 0");
	}

	const ordered = [...processes].sort((a, b) => {
		if (a.arrivalTime === b.arrivalTime) {
			return a.id.localeCompare(b.id);
		}
		return a.arrivalTime - b.arrivalTime;
	});
	const traces: ProcessExecutionTrace[] = ordered.map((proc) => cloneProcess(proc));
	const traceById = new Map(traces.map((trace) => [trace.process.id, trace]));
	const slices: ScheduledSlice[] = [];
	const queue: ProcessExecutionTrace[] = [];
	const index = { value: 0 };
	let currentTime = 0;
	let idleTime = 0;

	if (ordered.length === 0) {
		return { slices, traces, totalTime: 0, idleTime: 0 };
	}

	currentTime = Math.min(...ordered.map((proc) => proc.arrivalTime));
	enqueueArrivals(ordered, index, currentTime, queue, traceById);

	while (queue.length > 0 || index.value < ordered.length) {
		if (queue.length === 0) {
			const nextArrival = ordered[index.value].arrivalTime;
			idleTime += nextArrival - currentTime;
			currentTime = nextArrival;
			enqueueArrivals(ordered, index, currentTime, queue, traceById);
			continue;
		}

		const trace = queue.shift();
		if (!trace) {
			continue;
		}

		const sliceTime = Math.min(quantum, trace.remainingTime);
		if (currentTime < trace.process.arrivalTime) {
			idleTime += trace.process.arrivalTime - currentTime;
			currentTime = trace.process.arrivalTime;
		}
		trace.startTimes.push(currentTime);
		const endTime = currentTime + sliceTime;
		trace.remainingTime -= sliceTime;
		if (trace.remainingTime < 0) {
			trace.remainingTime = 0;
		}
		slices.push({ processId: trace.process.id, startTime: currentTime, endTime });
		currentTime = endTime;
		enqueueArrivals(ordered, index, currentTime, queue, traceById);

		if (trace.remainingTime === 0) {
			trace.completionTime = currentTime;
		} else {
			queue.push(trace);
		}
	}

	return {
		slices,
		traces,
		totalTime: currentTime,
		idleTime,
	};
};

export default runRoundRobin;

