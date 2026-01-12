"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runOnce = exports.runInteractiveConsole = void 0;
const node_process_1 = require("node:process");
const promises_1 = require("node:readline/promises");
const scheduler_1 = require("../Core/scheduler");
const results_display_1 = require("./results_display");
const process_generator_1 = require("../Utils/process_generator");
const file_handler_1 = require("../Utils/file_handler");
const askNumber = async (prompt, rl, fallback) => {
    const answer = (await rl.question(prompt)).trim();
    if (answer.length === 0 && fallback !== undefined) {
        return fallback;
    }
    const parsed = Number(answer);
    if (Number.isNaN(parsed)) {
        console.log("Valor no valido, intenta de nuevo.");
        return askNumber(prompt, rl, fallback);
    }
    return parsed;
};
const askBoolean = async (prompt, rl, fallback = false) => {
    const answer = (await rl.question(prompt)).trim().toLowerCase();
    if (answer.length === 0) {
        return fallback;
    }
    return ["s", "si", "sí", "y", "yes"].includes(answer);
};
const askProcessesManual = async (rl) => {
    const count = await askNumber("Cantidad de procesos: ", rl);
    const processes = [];
    for (let index = 0; index < count; index += 1) {
        const id = (await rl.question(`ID proceso ${index + 1}: `)).trim() || `P${index + 1}`;
        const arrivalTime = await askNumber(`Llegada para ${id}: `, rl, 0);
        const burstTime = await askNumber(`Rafaga para ${id}: `, rl);
        const priorityInput = (await rl.question(`Prioridad para ${id} (opcional): `)).trim();
        const priority = priorityInput.length > 0 ? Number(priorityInput) : undefined;
        processes.push({ id, arrivalTime, burstTime, priority });
    }
    return processes;
};
const choosePredefinedCase = async (rl) => {
    const cases = (0, process_generator_1.getPredefinedCases)();
    console.log("\nCasos disponibles:");
    cases.forEach((item, index) => {
        console.log(`${index + 1}. ${item.name} - ${item.description ?? ""}`);
    });
    const choice = await askNumber("Selecciona un caso: ", rl);
    const selected = cases[choice - 1];
    if (!selected) {
        console.log("Opcion invalida, se usara el primer caso.");
        return cases[0];
    }
    return selected;
};
const askProcessSource = async (rl) => {
    console.log("\nOrigen de procesos:");
    console.log("1. Caso predefinido del proyecto");
    console.log("2. Cargar desde archivo (.json / .csv)");
    console.log("3. Generar aleatoriamente");
    console.log("4. Ingresar manualmente");
    const option = await askNumber("Selecciona opcion: ", rl);
    switch (option) {
        case 1: {
            const selected = await choosePredefinedCase(rl);
            return selected.processes;
        }
        case 2: {
            const path = (await rl.question("Ruta del archivo: ")).trim();
            return (0, file_handler_1.loadProcesses)(path);
        }
        case 3: {
            const count = await askNumber("Cantidad de procesos a generar: ", rl, 5);
            return (0, process_generator_1.generateRandomProcesses)(count);
        }
        case 4:
        default:
            return askProcessesManual(rl);
    }
};
const askAlgorithm = async (rl) => {
    const algorithms = (0, scheduler_1.getAlgorithms)();
    console.log("\nAlgoritmos disponibles:");
    console.log("0. Ejecutar todos");
    algorithms.forEach((item, index) => {
        console.log(`${index + 1}. ${item.name}`);
    });
    const choice = await askNumber("Selecciona algoritmo: ", rl, 1);
    if (choice === 0) {
        const options = {};
        const roundRobin = algorithms.find((item) => item.key === scheduler_1.SchedulerAlgorithm.RoundRobin);
        if (roundRobin) {
            const needsQuantum = await askBoolean("Deseas cambiar el quantum por defecto (4)? [s/N]: ", rl, false);
            if (needsQuantum) {
                const quantum = await askNumber("Quantum: ", rl, 4);
                options[scheduler_1.SchedulerAlgorithm.RoundRobin] = { quantum };
            }
            else {
                options[scheduler_1.SchedulerAlgorithm.RoundRobin] = { quantum: 4 };
            }
        }
        const wantsPreemptive = await askBoolean("Prioridad con desalojo? [s/N]: ", rl, false);
        options[scheduler_1.SchedulerAlgorithm.Priority] = { preemptivePriority: wantsPreemptive };
        return { mode: "all", options };
    }
    const selected = algorithms[choice - 1] ?? algorithms[0];
    const options = {};
    if (selected.key === scheduler_1.SchedulerAlgorithm.RoundRobin) {
        const quantum = await askNumber("Quantum para Round Robin (default 4): ", rl, 4);
        options.quantum = quantum;
    }
    if (selected.key === scheduler_1.SchedulerAlgorithm.Priority) {
        const preemptive = await askBoolean("Deseas habilitar prioridad con desalojo? [s/N]: ", rl, false);
        options.preemptivePriority = preemptive;
    }
    return { mode: "single", key: selected.key, options };
};
const runSimulations = (processes, selection) => {
    if (selection.mode === "single") {
        return (0, scheduler_1.runSimulation)(selection.key, processes, selection.options);
    }
    return (0, scheduler_1.runAllSimulations)(processes, selection.options);
};
const presentResults = (outcome) => {
    if (Array.isArray(outcome)) {
        outcome.forEach((result) => (0, results_display_1.printSimulationResult)(result));
        (0, results_display_1.printComparison)(outcome);
    }
    else {
        (0, results_display_1.printSimulationResult)(outcome);
    }
};
const runInteractiveConsole = async () => {
    const rl = (0, promises_1.createInterface)({ input: node_process_1.stdin, output: node_process_1.stdout });
    console.log("Simulador de Planificacion de CPU");
    try {
        let continueLoop = true;
        while (continueLoop) {
            try {
                const processes = await askProcessSource(rl);
                const selection = await askAlgorithm(rl);
                const outcome = runSimulations(processes, selection);
                presentResults(outcome);
            }
            catch (error) {
                console.error("Error durante la simulacion:", error.message);
            }
            continueLoop = await askBoolean("\nDeseas ejecutar otra simulacion? [s/N]: ", rl, false);
        }
    }
    finally {
        rl.close();
    }
};
exports.runInteractiveConsole = runInteractiveConsole;
const runOnce = (processes, selection) => {
    const outcome = runSimulations(processes, selection);
    presentResults(outcome);
    return outcome;
};
exports.runOnce = runOnce;
