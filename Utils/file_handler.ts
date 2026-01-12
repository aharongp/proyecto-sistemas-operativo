import { promises as fs } from "node:fs";
import path from "node:path";

import { ProcessInput, validateProcesses } from "../Core/process";

const parseNumber = (value: unknown, fallback?: number): number => {
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

const sanitizeProcess = (raw: Record<string, unknown>, index: number): ProcessInput => {
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

export const readProcessesFromJson = async (filePath: string): Promise<ProcessInput[]> => {
	const content = await fs.readFile(filePath, "utf8");
	const payload = JSON.parse(content);
	if (!Array.isArray(payload)) {
		throw new Error("JSON file must contain an array of processes");
	}
	const processes = payload.map((entry, index) => sanitizeProcess(entry, index));
	validateProcesses(processes);
	return processes;
};

const CSV_SEPARATORS = [",", ";", "\t"];

const detectSeparator = (header: string) => {
	for (const separator of CSV_SEPARATORS) {
		if (header.includes(separator)) {
			return separator;
		}
	}
	return ",";
};

export const readProcessesFromCsv = async (filePath: string): Promise<ProcessInput[]> => {
	const content = await fs.readFile(filePath, "utf8");
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
		const raw: Record<string, unknown> = {};
		headers.forEach((header, headerIndex) => {
			raw[header] = values[headerIndex];
		});
		return sanitizeProcess(raw, index);
	});

	validateProcesses(processes);
	return processes;
};

export const writeProcessesToJson = async (filePath: string, processes: ProcessInput[]) => {
	await fs.writeFile(filePath, JSON.stringify(processes, null, 2), "utf8");
};

const toCsvLine = (process: ProcessInput) =>
	[process.id, process.arrivalTime, process.burstTime, process.priority ?? ""].join(",");

export const writeProcessesToCsv = async (filePath: string, processes: ProcessInput[]) => {
	const header = "id,arrivalTime,burstTime,priority";
	const rows = processes.map((process) => toCsvLine(process));
	const payload = [header, ...rows].join("\n");
	await fs.writeFile(filePath, payload, "utf8");
};

export const loadProcesses = async (filePath: string): Promise<ProcessInput[]> => {
	const extension = path.extname(filePath).toLowerCase();
	if (extension === ".json") {
		return readProcessesFromJson(filePath);
	}
	if (extension === ".csv" || extension === ".txt") {
		return readProcessesFromCsv(filePath);
	}
	throw new Error(`Unsupported file format: ${extension}`);
};

export const saveProcesses = async (filePath: string, processes: ProcessInput[]) => {
	const extension = path.extname(filePath).toLowerCase();
	if (extension === ".json") {
		await writeProcessesToJson(filePath, processes);
		return;
	}
	if (extension === ".csv" || extension === ".txt") {
		await writeProcessesToCsv(filePath, processes);
		return;
	}
	throw new Error(`Unsupported file format: ${extension}`);
};
