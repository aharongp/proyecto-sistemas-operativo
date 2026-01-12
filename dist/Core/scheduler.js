"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runAllSimulations = exports.runSimulation = exports.getAlgorithms = exports.SchedulerAlgorithm = void 0;
const metrics_1 = require("./metrics");
const fcfs_1 = __importDefault(require("./algorithms/fcfs"));
const sjf_1 = __importDefault(require("./algorithms/sjf"));
const round_robin_1 = __importDefault(require("./algorithms/round_robin"));
const priority_1 = __importDefault(require("./algorithms/priority"));
const process_1 = require("./process");
var SchedulerAlgorithm;
(function (SchedulerAlgorithm) {
    SchedulerAlgorithm["Fcfs"] = "FCFS";
    SchedulerAlgorithm["Sjf"] = "SJF";
    SchedulerAlgorithm["RoundRobin"] = "ROUND_ROBIN";
    SchedulerAlgorithm["Priority"] = "PRIORITY";
})(SchedulerAlgorithm || (exports.SchedulerAlgorithm = SchedulerAlgorithm = {}));
const ALGORITHMS = {
    [SchedulerAlgorithm.Fcfs]: {
        key: SchedulerAlgorithm.Fcfs,
        name: "First Come First Served",
        run: fcfs_1.default,
    },
    [SchedulerAlgorithm.Sjf]: {
        key: SchedulerAlgorithm.Sjf,
        name: "Shortest Job First",
        run: sjf_1.default,
    },
    [SchedulerAlgorithm.RoundRobin]: {
        key: SchedulerAlgorithm.RoundRobin,
        name: "Round Robin",
        run: round_robin_1.default,
        requiresQuantum: true,
    },
    [SchedulerAlgorithm.Priority]: {
        key: SchedulerAlgorithm.Priority,
        name: "Priority Scheduling",
        run: priority_1.default,
    },
};
const getAlgorithms = () => Object.values(ALGORITHMS).map((algorithm) => ({
    key: algorithm.key,
    name: algorithm.name,
    requiresQuantum: algorithm.requiresQuantum,
}));
exports.getAlgorithms = getAlgorithms;
const runSimulation = (algorithm, processes, options = {}) => {
    (0, process_1.validateProcesses)(processes);
    const descriptor = ALGORITHMS[algorithm];
    if (!descriptor) {
        throw new Error(`Unknown algorithm ${algorithm}`);
    }
    const { traces, slices, totalTime, idleTime } = descriptor.run(processes, options);
    const { metrics, summary } = (0, metrics_1.calculateMetrics)({ traces, totalTime, idleTime, slices });
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
exports.runSimulation = runSimulation;
const runAllSimulations = (processes, options = {}) => (0, exports.getAlgorithms)().map((algorithm) => (0, exports.runSimulation)(algorithm.key, processes, options[algorithm.key] ?? {}));
exports.runAllSimulations = runAllSimulations;
