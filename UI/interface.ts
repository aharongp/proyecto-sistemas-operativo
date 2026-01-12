import { stdin as entrada, stdout as salida } from "node:process";
import { createInterface } from "node:readline/promises";

import {
	AlgoritmoPlanificacion,
	ejecutarTodasSimulaciones,
	ejecutarSimulacion,
	obtenerAlgoritmos,
} from "../Core/scheduler";
import { OpcionesPlanificador, ProcesoEntrada, ResultadoSimulacion } from "../Core/process";
import { imprimirComparativa, imprimirResultadoSimulacion } from "./results_display";
import type { ConjuntoProcesos } from "../Utils/process_generator";
import { generarProcesosAleatorios, obtenerCasosPredefinidos } from "../Utils/process_generator";
import { cargarProcesos } from "../Utils/file_handler";

type SeleccionAlgoritmo =
	| {
		modo: "uno";
		clave: AlgoritmoPlanificacion;
		opciones: OpcionesPlanificador;
	}
	| {
		modo: "todos";
		opciones: Partial<Record<AlgoritmoPlanificacion, OpcionesPlanificador>>;
	};

/**
 * Solicita al usuario un número y maneja la validación básica.
 */
const solicitarNumero = async (
	mensaje: string,
	rl: ReturnType<typeof createInterface>,
	respaldo?: number,
): Promise<number> => {
	const respuesta = (await rl.question(mensaje)).trim();
	if (respuesta.length === 0 && respaldo !== undefined) {
		return respaldo;
	}
	const parseado = Number(respuesta);
	if (Number.isNaN(parseado)) {
		console.log("Valor no válido, intenta de nuevo.");
		return solicitarNumero(mensaje, rl, respaldo);
	}
	return parseado;
};

/**
 * Solicita una respuesta afirmativa/negativa con soporte a valores por defecto.
 */
const solicitarBooleano = async (
	mensaje: string,
	rl: ReturnType<typeof createInterface>,
	respaldo = false,
): Promise<boolean> => {
	const respuesta = (await rl.question(mensaje)).trim().toLowerCase();
	if (respuesta.length === 0) {
		return respaldo;
	}
	return ["s", "si", "sí", "y", "yes"].includes(respuesta);
};

/**
 * Permite capturar procesos de manera manual desde consola.
 */
const solicitarProcesosManual = async (
	rl: ReturnType<typeof createInterface>,
): Promise<ProcesoEntrada[]> => {
	const cantidad = await solicitarNumero("Cantidad de procesos: ", rl);
	const procesos: ProcesoEntrada[] = [];
	for (let indice = 0; indice < cantidad; indice += 1) {
		const id = (await rl.question(`ID proceso ${indice + 1}: `)).trim() || `P${indice + 1}`;
		const tiempoLlegada = await solicitarNumero(`Llegada para ${id}: `, rl, 0);
		const tiempoRafaga = await solicitarNumero(`Ráfaga para ${id}: `, rl);
		const textoPrioridad = (await rl.question(`Prioridad para ${id} (opcional): `)).trim();
		const prioridad = textoPrioridad.length > 0 ? Number(textoPrioridad) : undefined;
		procesos.push({ id, tiempoLlegada, tiempoRafaga, prioridad });
	}
	return procesos;
};

/**
 * Muestra los casos predefinidos y permite elegir uno.
 */
const elegirCasoPredefinido = async (
	rl: ReturnType<typeof createInterface>,
): Promise<ConjuntoProcesos> => {
	const casos = obtenerCasosPredefinidos();
	console.log("\nCasos disponibles:");
	casos.forEach((caso, indice) => {
		console.log(`${indice + 1}. ${caso.nombre} - ${caso.descripcion ?? ""}`);
	});
	const seleccion = await solicitarNumero("Selecciona un caso: ", rl);
	const elegido = casos[seleccion - 1];
	if (!elegido) {
		console.log("Opción inválida, se usará el primer caso.");
		return casos[0];
	}
	return elegido;
};

/**
 * Determina el origen de los procesos para una simulación.
 */
const solicitarFuenteProcesos = async (
	rl: ReturnType<typeof createInterface>,
): Promise<ProcesoEntrada[]> => {
	console.log("\nOrigen de procesos:");
	console.log("1. Caso predefinido del proyecto");
	console.log("2. Cargar desde archivo (.json / .csv)");
	console.log("3. Generar aleatoriamente");
	console.log("4. Ingresar manualmente");
	const opcion = await solicitarNumero("Selecciona opción: ", rl);

	switch (opcion) {
		case 1: {
			const caso = await elegirCasoPredefinido(rl);
			return caso.procesos;
		}
		case 2: {
			const ruta = (await rl.question("Ruta del archivo: ")).trim();
			return cargarProcesos(ruta);
		}
		case 3: {
			const cantidad = await solicitarNumero("Cantidad de procesos a generar: ", rl, 5);
			return generarProcesosAleatorios(cantidad);
		}
		case 4:
		default:
			return solicitarProcesosManual(rl);
	}
};

/**
 * Solicita el algoritmo a ejecutar y sus opciones asociadas.
 */
const solicitarAlgoritmo = async (
	rl: ReturnType<typeof createInterface>,
): Promise<SeleccionAlgoritmo> => {
	const algoritmos = obtenerAlgoritmos();
	console.log("\nAlgoritmos disponibles:");
	console.log("0. Ejecutar todos");
	algoritmos.forEach((algoritmo, indice) => {
		console.log(`${indice + 1}. ${algoritmo.nombre}`);
	});

	const seleccion = await solicitarNumero("Selecciona algoritmo: ", rl, 1);
	if (seleccion === 0) {
		const opciones: Partial<Record<AlgoritmoPlanificacion, OpcionesPlanificador>> = {};
		const roundRobin = algoritmos.find((algoritmo) => algoritmo.clave === AlgoritmoPlanificacion.RoundRobin);
		if (roundRobin) {
			const cambiarQuantum = await solicitarBooleano("¿Deseas cambiar el quantum por defecto (4)? [s/N]: ", rl, false);
			const quantum = cambiarQuantum ? await solicitarNumero("Quantum: ", rl, 4) : 4;
			opciones[AlgoritmoPlanificacion.RoundRobin] = { quantum };
		}
		const prioridadExpropiativa = await solicitarBooleano("¿Prioridad con desalojo? [s/N]: ", rl, false);
		opciones[AlgoritmoPlanificacion.Prioridad] = { prioridadExpropiativa };
		return { modo: "todos", opciones };
	}

	const algoritmoSeleccionado = algoritmos[seleccion - 1] ?? algoritmos[0];
	const opciones: OpcionesPlanificador = {};
	if (algoritmoSeleccionado.clave === AlgoritmoPlanificacion.RoundRobin) {
		opciones.quantum = await solicitarNumero("Quantum para Round Robin (default 4): ", rl, 4);
	}
	if (algoritmoSeleccionado.clave === AlgoritmoPlanificacion.Prioridad) {
		opciones.prioridadExpropiativa = await solicitarBooleano("¿Deseas habilitar prioridad con desalojo? [s/N]: ", rl, false);
	}
	return { modo: "uno", clave: algoritmoSeleccionado.clave, opciones };
};

/**
 * Ejecuta la simulación según la selección indicada.
 */
const ejecutarSegunSeleccion = (
	procesos: ProcesoEntrada[],
	seleccion: SeleccionAlgoritmo,
): ResultadoSimulacion | ResultadoSimulacion[] => {
	if (seleccion.modo === "uno") {
		return ejecutarSimulacion(seleccion.clave, procesos, seleccion.opciones);
	}
	return ejecutarTodasSimulaciones(procesos, seleccion.opciones);
};

/**
 * Muestra los resultados en consola ya sea de una o múltiples simulaciones.
 */
const mostrarResultados = (resultado: ResultadoSimulacion | ResultadoSimulacion[]) => {
	if (Array.isArray(resultado)) {
		resultado.forEach((item) => imprimirResultadoSimulacion(item));
		imprimirComparativa(resultado);
	} else {
		imprimirResultadoSimulacion(resultado);
	}
};

/**
 * Punto de entrada para la experiencia interactiva por consola.
 */
export const ejecutarConsolaInteractiva = async () => {
	const rl = createInterface({ input: entrada, output: salida });
	console.log("Simulador de Planificación de CPU");

	try {
		let continuar = true;
		while (continuar) {
			try {
				const procesos = await solicitarFuenteProcesos(rl);
				const seleccion = await solicitarAlgoritmo(rl);
				const resultado = ejecutarSegunSeleccion(procesos, seleccion);
				mostrarResultados(resultado);
			} catch (error) {
				console.error("Error durante la simulación:", (error as Error).message);
			}

			continuar = await solicitarBooleano("\n¿Deseas ejecutar otra simulación? [s/N]: ", rl, false);
		}
	} finally {
		rl.close();
	}
};

/**
 * Ejecuta la consola en modo no interactivo (útil para pruebas automatizadas).
 */
export const ejecutarUnaVez = (
	procesos: ProcesoEntrada[],
	seleccion: SeleccionAlgoritmo,
) => {
	const resultado = ejecutarSegunSeleccion(procesos, seleccion);
	mostrarResultados(resultado);
	return resultado;
};

// Alias en inglés para compatibilidad con scripts anteriores
export const runInteractiveConsole = ejecutarConsolaInteractiva;
export const runOnce = ejecutarUnaVez;




