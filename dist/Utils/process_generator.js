"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildCustomCase = exports.generateRandomProcesses = exports.getPredefinedCase = exports.getPredefinedCases = void 0;
const clamp = (value, min, max) => Math.max(min, Math.min(value, max));
const createProcess = (id, arrivalTime, burstTime, priority) => ({
    id,
    arrivalTime,
    burstTime,
    priority,
});
const CASE_ONE = {
    name: "Caso 1 - Procesos Basicos",
    description: "Conjunto base del enunciado con cuatro procesos",
    processes: [
        createProcess("P1", 0, 8, 3),
        createProcess("P2", 1, 4, 1),
        createProcess("P3", 2, 9, 4),
        createProcess("P4", 3, 5, 2),
    ],
};
const CASE_TWO = {
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
const CASE_THREE = {
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
const getPredefinedCases = () => PREDEFINED_CASES;
exports.getPredefinedCases = getPredefinedCases;
const getPredefinedCase = (name) => PREDEFINED_CASES.find((set) => set.name.toLowerCase() === name.toLowerCase());
exports.getPredefinedCase = getPredefinedCase;
const generateRandomProcesses = (count, options = {}) => {
    if (count <= 0) {
        return [];
    }
    const [arrivalMin, arrivalMax] = options.arrivalRange ?? [0, 10];
    const [burstMin, burstMax] = options.burstRange ?? [1, 12];
    const [priorityMin, priorityMax] = options.priorityRange ?? [1, 5];
    const processes = [];
    for (let index = 0; index < count; index += 1) {
        const id = `PX${index + 1}`;
        const arrival = Math.floor(Math.random() * (arrivalMax - arrivalMin + 1)) + arrivalMin;
        const burst = Math.floor(Math.random() * (burstMax - burstMin + 1)) + burstMin;
        const priority = Math.floor(Math.random() * (priorityMax - priorityMin + 1)) + priorityMin;
        processes.push(createProcess(id, clamp(arrival, arrivalMin, arrivalMax), clamp(burst, burstMin, burstMax), clamp(priority, priorityMin, priorityMax)));
    }
    return processes.sort((a, b) => {
        if (a.arrivalTime === b.arrivalTime) {
            return a.id.localeCompare(b.id);
        }
        return a.arrivalTime - b.arrivalTime;
    });
};
exports.generateRandomProcesses = generateRandomProcesses;
const buildCustomCase = (name, processes, description) => ({
    name,
    description,
    processes,
});
exports.buildCustomCase = buildCustomCase;
