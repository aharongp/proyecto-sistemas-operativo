"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateProcesses = exports.sortByArrival = exports.cloneProcess = exports.ProcessState = void 0;
var ProcessState;
(function (ProcessState) {
    ProcessState["New"] = "NEW";
    ProcessState["Ready"] = "READY";
    ProcessState["Running"] = "RUNNING";
    ProcessState["Waiting"] = "WAITING";
    ProcessState["Terminated"] = "TERMINATED";
})(ProcessState || (exports.ProcessState = ProcessState = {}));
const cloneProcess = (process) => ({
    process: { ...process },
    startTimes: [],
    completionTime: null,
    remainingTime: process.burstTime,
});
exports.cloneProcess = cloneProcess;
const sortByArrival = (processes) => [...processes].sort((a, b) => {
    if (a.arrivalTime === b.arrivalTime) {
        return a.id.localeCompare(b.id);
    }
    return a.arrivalTime - b.arrivalTime;
});
exports.sortByArrival = sortByArrival;
const validateProcesses = (processes) => {
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
};
exports.validateProcesses = validateProcesses;
