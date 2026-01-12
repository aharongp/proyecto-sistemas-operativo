"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const process_1 = require("../process");
const runFcfs = (processes) => {
    const ordered = [...processes].sort((a, b) => {
        if (a.arrivalTime === b.arrivalTime) {
            return a.id.localeCompare(b.id);
        }
        return a.arrivalTime - b.arrivalTime;
    });
    const traces = ordered.map((proc) => (0, process_1.cloneProcess)(proc));
    const traceById = new Map(traces.map((trace) => [trace.process.id, trace]));
    const slices = [];
    let currentTime = 0;
    let idleTime = 0;
    ordered.forEach((proc) => {
        const trace = traceById.get(proc.id);
        if (!trace) {
            throw new Error(`Missing runtime trace for process ${proc.id}`);
        }
        if (currentTime < proc.arrivalTime) {
            idleTime += proc.arrivalTime - currentTime;
            currentTime = proc.arrivalTime;
        }
        trace.startTimes.push(currentTime);
        const endTime = currentTime + proc.burstTime;
        trace.remainingTime = 0;
        trace.completionTime = endTime;
        slices.push({ processId: proc.id, startTime: currentTime, endTime });
        currentTime = endTime;
    });
    return {
        slices,
        traces,
        totalTime: currentTime,
        idleTime,
    };
};
exports.default = runFcfs;
