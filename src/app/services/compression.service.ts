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
  private outputDir: FileSystemDirectoryHandle | null = null;
  readonly tasks = signal<CompressTask[]>([]);

  constructor() {
    this.worker.onmessage = async ({ data }) => {
      // actualiza barra de progreso
      this.tasks.update(ts => ts.map(t => t.id === data.id ? { ...t, ...data } : t));

      if (data.outFile) {
        await this.saveFile(data.outFile);
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

  /** Request user to pick an output directory */
  async requestOutputDirectory() {
    try {
      this.outputDir = await (window as any).showDirectoryPicker();
    } catch (err) {
      console.warn('Directory picker cancelled or not supported', err);
      this.outputDir = null;
    }
  }

  private async saveFile(file: File) {
    if (!this.outputDir) {
      saveAs(file, file.name);
      return;
    }
    try {
      const handle = await this.outputDir.getFileHandle(file.name, { create: true });
      const writable = await handle.createWritable();
      await writable.write(file);
      await writable.close();
    } catch (err) {
      console.error('Failed to write file to directory', err);
      saveAs(file, file.name);
    }
  }
}
