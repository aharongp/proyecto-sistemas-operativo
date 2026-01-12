import { ProcessExecutionTrace, ProcessInput, ScheduledSlice, SchedulerOptions } from "../process";

export interface AlgorithmResult {
  slices: ScheduledSlice[];
  traces: ProcessExecutionTrace[];
  totalTime: number;
  idleTime: number;
}

export type AlgorithmImplementation = (
  processes: ProcessInput[],
  options?: SchedulerOptions,
) => AlgorithmResult;
