"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveProcesses = exports.loadProcesses = exports.writeProcessesToCsv = exports.writeProcessesToJson = exports.readProcessesFromCsv = exports.readProcessesFromJson = void 0;
const node_fs_1 = require("node:fs");
const node_path_1 = __importDefault(require("node:path"));
const process_1 = require("../Core/process");
const parseNumber = (value, fallback) => {
    if (value === undefined || value === null || value === "") {
        if (fallback !== undefined) {
            return fallback;
        }
        throw new Error("Required numeric value missing");
    }
    const parsed = Number(value);
    if (Number.isNaN(parsed)) {
        throw new Error(`Invalid numeric value: ${value}`);
    }
    return parsed;
};
const sanitizeProcess = (raw, index) => {
    if (!raw.id) {
        throw new Error(`Process at index ${index} missing id`);
    }
    const arrivalTime = parseNumber(raw.arrivalTime, 0);
    const burstTime = parseNumber(raw.burstTime);
    const priority = raw.priority !== undefined ? parseNumber(raw.priority) : undefined;
    return {
        id: String(raw.id),
        arrivalTime,
        burstTime,
        priority,
    };
};
const readProcessesFromJson = async (filePath) => {
    const content = await node_fs_1.promises.readFile(filePath, "utf8");
    const payload = JSON.parse(content);
    if (!Array.isArray(payload)) {
        throw new Error("JSON file must contain an array of processes");
    }
    const processes = payload.map((entry, index) => sanitizeProcess(entry, index));
    (0, process_1.validateProcesses)(processes);
    return processes;
};
exports.readProcessesFromJson = readProcessesFromJson;
const CSV_SEPARATORS = [",", ";", "\t"];
const detectSeparator = (header) => {
    for (const separator of CSV_SEPARATORS) {
        if (header.includes(separator)) {
            return separator;
        }
    }
    return ",";
};
const readProcessesFromCsv = async (filePath) => {
    const content = await node_fs_1.promises.readFile(filePath, "utf8");
    const lines = content
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0 && !line.startsWith("#"));
    if (lines.length === 0) {
        return [];
    }
    const separator = detectSeparator(lines[0]);
    const headers = lines[0].split(separator).map((value) => value.trim());
    const rows = lines.slice(1);
    const processes = rows.map((row, index) => {
        const values = row.split(separator).map((value) => value.trim());
        const raw = {};
        headers.forEach((header, headerIndex) => {
            raw[header] = values[headerIndex];
        });
        return sanitizeProcess(raw, index);
    });
    (0, process_1.validateProcesses)(processes);
    return processes;
};
exports.readProcessesFromCsv = readProcessesFromCsv;
const writeProcessesToJson = async (filePath, processes) => {
    await node_fs_1.promises.writeFile(filePath, JSON.stringify(processes, null, 2), "utf8");
};
exports.writeProcessesToJson = writeProcessesToJson;
const toCsvLine = (process) => [process.id, process.arrivalTime, process.burstTime, process.priority ?? ""].join(",");
const writeProcessesToCsv = async (filePath, processes) => {
    const header = "id,arrivalTime,burstTime,priority";
    const rows = processes.map((process) => toCsvLine(process));
    const payload = [header, ...rows].join("\n");
    await node_fs_1.promises.writeFile(filePath, payload, "utf8");
};
exports.writeProcessesToCsv = writeProcessesToCsv;
const loadProcesses = async (filePath) => {
    const extension = node_path_1.default.extname(filePath).toLowerCase();
    if (extension === ".json") {
        return (0, exports.readProcessesFromJson)(filePath);
    }
    if (extension === ".csv" || extension === ".txt") {
        return (0, exports.readProcessesFromCsv)(filePath);
    }
    throw new Error(`Unsupported file format: ${extension}`);
};
exports.loadProcesses = loadProcesses;
const saveProcesses = async (filePath, processes) => {
    const extension = node_path_1.default.extname(filePath).toLowerCase();
    if (extension === ".json") {
        await (0, exports.writeProcessesToJson)(filePath, processes);
        return;
    }
    if (extension === ".csv" || extension === ".txt") {
        await (0, exports.writeProcessesToCsv)(filePath, processes);
        return;
    }
    throw new Error(`Unsupported file format: ${extension}`);
};
exports.saveProcesses = saveProcesses;
