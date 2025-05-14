import { Component, signal } from '@angular/core';
import { NgIf, NgForOf, NgClass } from '@angular/common';
import { ProgressBarComponent } from '../progress-bar/progress-bar.component';
import { MatButtonModule } from '@angular/material/button';
import { CompressionService } from '../../services/compression.service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-file-drop',
  standalone: true,
  templateUrl: './file-drop.component.html',
  styleUrls: ['./file-drop.component.scss'],
  imports: [NgIf, NgForOf, NgClass, MatButtonModule, MatIconModule, ProgressBarComponent],

})
export class FileDropComponent {
  readonly files = signal<File[]>([]);
  selectedFormat = signal<'zip' | 'gzip' | null>(null);
  labelText = '…o arrástralo aquí';

  constructor(private compressSvc: CompressionService) {}


  selectFormat(fmt: 'zip' | 'gzip') {
    this.selectedFormat.set(fmt);
  }

  /** Evita que el navegador abra el archivo al arrastrarlo */
  dragOver(evt: DragEvent) {
    evt.preventDefault();
  }

  onDragOver(evt: DragEvent) {
    evt.preventDefault(); // ← ¡clave!
    (evt.currentTarget as HTMLElement).classList.add('active');
  }

  onDragLeave(evt: DragEvent) {
    (evt.currentTarget as HTMLElement).classList.remove('active');
  }

  onDrop(evt: DragEvent) {
    evt.preventDefault();
    (evt.currentTarget as HTMLElement).classList.remove('active');
    if (!evt.dataTransfer?.files?.length) return;
    this.processFiles(Array.from(evt.dataTransfer.files));
  }

  handleInput(evt: Event) {
    const list = (evt.target as HTMLInputElement).files;
    list && this.processFiles(Array.from(list));
    (evt.target as HTMLInputElement).value = ''; // reset
  }

  private processFiles(files: File[]) {
    const fmt = this.selectedFormat();
    if (!fmt) return;
  
    files.forEach(f => this.compressSvc.enqueue(f, fmt));
    this.files.update(o => [...o, ...files]);
  }

  /** Se dispara tanto desde <input> como desde drop */
  onFiles(evt: DragEvent | Event) {
    evt.preventDefault?.();

    const list: FileList | null =
      (evt as DragEvent).dataTransfer?.files ??
      (evt.target as HTMLInputElement).files ??
      null;

    if (!list) return;
    const arr = Array.from(list);
    this.files.update(old => [...old, ...arr]);
    arr.forEach(f => this.compressSvc.enqueue(f));
  }

  /** trackBy para el *ngFor */
  trackByFn = (_: number, file: File) => file.name;
}
