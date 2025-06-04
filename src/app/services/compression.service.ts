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
  readonly tasks = signal<CompressTask[]>([]);

  private updateTask(data: Partial<CompressTask> & { id: number }) {
    this.tasks.update(ts => {
      const idx = ts.findIndex(t => t.id === data.id);
      if (idx === -1) return ts;
      const updated = { ...ts[idx], ...data } as CompressTask;
      const copy = ts.slice();
      copy[idx] = updated;
      return copy;
    });
  }

  constructor() {
    this.worker.onmessage = ({ data }) => {
      // actualiza barra de progreso de forma más eficiente
      this.updateTask(data);

      if (data.outFile) {
        saveAs(data.outFile, data.outFile.name);
      }
    };

    // logs básicos
    this.worker.onerror = e => console.error('Worker error', e);
  }

  /** Comprimir */
  enqueue(file: File, mode: 'gzip' | 'zip' = 'gzip') {
    const task: CompressTask = { id: ++this.nextId, file, progress: 0 };
    this.tasks.update(a => [...a, task]);
    this.worker.postMessage({ ...task, action: 'compress', mode });
  }

  /** Descomprimir */
  enqueueDecompress(file: File) {
    const task: CompressTask = { id: ++this.nextId, file, progress: 0 };
    this.tasks.update(a => [...a, task]);
    this.worker.postMessage({ ...task, action: 'decompress' });
  }
}
