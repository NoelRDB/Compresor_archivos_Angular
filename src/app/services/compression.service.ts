import { Injectable, signal } from '@angular/core';
import { saveAs } from 'file-saver';

export interface CompressTask {
  id: number;
  file: File;
  progress: number;
  done?: boolean;
  error?: string;
}

@Injectable({ providedIn: 'root' })
export class CompressionService {
  private worker = new Worker(
    new URL('../workers/compression.worker', import.meta.url),
    { type: 'module' }
  );
  private nextId = 0;

  /** Lista reactiva de tareas */
  readonly tasks = signal<CompressTask[]>([]);

  constructor() {
    this.worker.onmessage = ({ data }) => {
      this.tasks.update(tasks =>
        tasks.map(t => (t.id === data.id ? { ...t, ...data } : t))
      );
      if (data.done) saveAs(data.outFile, data.outFile.name);
    };
  }

  enqueue(file: File, mode: 'gzip' | 'zip' = 'gzip') {
    const task: CompressTask = { id: ++this.nextId, file, progress: 0 };
    this.tasks.update((arr: CompressTask[]) => [...arr, task]);
    this.worker.postMessage({ ...task, mode });
  }
}
