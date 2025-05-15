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

  constructor() {
    this.worker.onmessage = ({ data }) => {
      // actualiza barra de progreso
      this.tasks.update(ts => ts.map(t => t.id === data.id ? { ...t, ...data } : t));

      // descarga segura (evitamos undefined)
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
