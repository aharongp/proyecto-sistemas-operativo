"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const process_1 = require("../process");
const getPriorityValue = (process) => process.priority ?? Number.MAX_SAFE_INTEGER;
const selectHighestPriority = (ready) => {
    const ordered = [...ready].sort((a, b) => {
        const priorityDiff = getPriorityValue(a.process) - getPriorityValue(b.process);
        if (priorityDiff !== 0) {
            return priorityDiff;
        }
        if (a.process.arrivalTime === b.process.arrivalTime) {
            return a.process.id.localeCompare(b.process.id);
        }
        return a.process.arrivalTime - b.process.arrivalTime;
    });
    return ordered[0];
};
const enqueueArrivals = (ordered, index, currentTime, ready, traceById) => {
    while (index.value < ordered.length && ordered[index.value].arrivalTime <= currentTime) {
        const arriving = ordered[index.value];
        const trace = traceById.get(arriving.id);
        if (!trace) {
            throw new Error(`Missing runtime trace for process ${arriving.id}`);
        }
        ready.push(trace);
        index.value += 1;
    }
};
const updateSlices = (slices, processId, startTime, endTime) => {
    const lastSlice = slices[slices.length - 1];
    if (lastSlice && lastSlice.processId === processId && lastSlice.endTime === startTime) {
        lastSlice.endTime = endTime;
        return;
    }
    slices.push({ processId, startTime, endTime });
};
const runPriorityInternal = (processes, preemptive) => {
    const ordered = [...processes].sort((a, b) => {
        if (a.arrivalTime === b.arrivalTime) {
            return a.id.localeCompare(b.id);
        }
        return a.arrivalTime - b.arrivalTime;
    });
    const traces = ordered.map((proc) => (0, process_1.cloneProcess)(proc));
    const traceById = new Map(traces.map((trace) => [trace.process.id, trace]));
    const ready = [];
    const slices = [];
    const index = { value: 0 };
    let currentTime = 0;
    let idleTime = 0;
    if (ordered.length === 0) {
        return { slices, traces, totalTime: 0, idleTime: 0 };
    }
    currentTime = Math.min(...ordered.map((proc) => proc.arrivalTime));
    enqueueArrivals(ordered, index, currentTime, ready, traceById);
    while (ready.length > 0 || index.value < ordered.length) {
        if (ready.length === 0) {
            const nextArrival = ordered[index.value].arrivalTime;
            idleTime += nextArrival - currentTime;
            currentTime = nextArrival;
            enqueueArrivals(ordered, index, currentTime, ready, traceById);
            continue;
        }
        const selected = selectHighestPriority(ready);
        const queueIndex = ready.findIndex((proc) => proc.process.id === selected.process.id);
        ready.splice(queueIndex, 1);
        if (selected.remainingTime <= 0) {
            continue;
        }
        if (selected.startTimes.length === 0 ||
            selected.startTimes[selected.startTimes.length - 1] !== currentTime) {
            selected.startTimes.push(currentTime);
        }
        const nextArrivalTime = index.value < ordered.length ? ordered[index.value].arrivalTime : Infinity;
        let runDuration = selected.remainingTime;
        if (preemptive && nextArrivalTime > currentTime) {
            runDuration = Math.min(runDuration, nextArrivalTime - currentTime);
            if (!Number.isFinite(runDuration) || runDuration <= 0) {
                runDuration = selected.remainingTime;
            }
        }
        const endTime = currentTime + runDuration;
        selected.remainingTime -= runDuration;
        if (selected.remainingTime < 0) {
            selected.remainingTime = 0;
        }
        updateSlices(slices, selected.process.id, currentTime, endTime);
        currentTime = endTime;
        enqueueArrivals(ordered, index, currentTime, ready, traceById);
        if (selected.remainingTime === 0) {
            selected.completionTime = currentTime;
        }
        else {
            ready.push(selected);
            if (!preemptive) {
                // Should not happen for non-preemptive, but guard to avoid infinite loop.
                selected.completionTime = currentTime;
                selected.remainingTime = 0;
            }
        }
    }
    return {
        slices,
        traces,
        totalTime: currentTime,
        idleTime,
    };
};
const runPriority = (processes, options = {}) => {
    const preemptive = options.preemptivePriority ?? false;
    return runPriorityInternal(processes, preemptive);
};
exports.default = runPriority;
