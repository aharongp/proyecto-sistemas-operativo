"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const process_1 = require("../process");
const selectShortestJob = (ready) => {
    const ordered = [...ready].sort((a, b) => {
        if (a.burstTime === b.burstTime) {
            if (a.arrivalTime === b.arrivalTime) {
                return a.id.localeCompare(b.id);
            }
            return a.arrivalTime - b.arrivalTime;
        }
        return a.burstTime - b.burstTime;
    });
    return ordered[0];
};
const runSjf = (processes) => {
    const ordered = [...processes].sort((a, b) => {
        if (a.arrivalTime === b.arrivalTime) {
            return a.id.localeCompare(b.id);
        }
        return a.arrivalTime - b.arrivalTime;
    });
    const traces = ordered.map((proc) => (0, process_1.cloneProcess)(proc));
    const traceById = new Map(traces.map((trace) => [trace.process.id, trace]));
    const slices = [];
    const ready = [];
    let currentTime = 0;
    let idleTime = 0;
    let index = 0;
    while (ready.length > 0 || index < ordered.length) {
        while (index < ordered.length && ordered[index].arrivalTime <= currentTime) {
            ready.push(ordered[index]);
            index += 1;
        }
        if (ready.length === 0) {
            const nextArrival = ordered[index].arrivalTime;
            idleTime += nextArrival - currentTime;
            currentTime = nextArrival;
            continue;
        }
        const next = selectShortestJob(ready);
        const queueIndex = ready.findIndex((proc) => proc.id === next.id);
        ready.splice(queueIndex, 1);
        const trace = traceById.get(next.id);
        if (!trace) {
            throw new Error(`Missing runtime trace for process ${next.id}`);
        }
        trace.startTimes.push(currentTime);
        const endTime = currentTime + next.burstTime;
        trace.remainingTime = 0;
        trace.completionTime = endTime;
        slices.push({ processId: next.id, startTime: currentTime, endTime });
        currentTime = endTime;
    }
    return {
        slices,
        traces,
        totalTime: currentTime,
        idleTime,
    };
};
exports.default = runSjf;
