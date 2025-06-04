import { Component, signal } from '@angular/core';
import { NgIf, NgForOf } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProgressBarComponent } from '../progress-bar/progress-bar.component';
import { CompressionService } from '../../services/compression.service';

@Component({
  selector: 'app-file-unzip',
  standalone: true,
  templateUrl: './file-unzip.component.html',
  styleUrls: ['./file-unzip.component.scss'],
  imports: [NgIf, NgForOf, MatButtonModule, MatIconModule, ProgressBarComponent],
})
export class FileUnzipComponent {
  readonly files = signal<File[]>([]);

  constructor(private svc: CompressionService, private snack: MatSnackBar) {}

  /* --- drag & drop idéntico pero sin formato ----- */
  onDragEnter(evt: DragEvent) {
  evt.preventDefault();
  (evt.currentTarget as HTMLElement).classList.add('active');
}

onDragOver(evt: DragEvent) {
  evt.preventDefault();               // necesario para permitir soltar
}

onDragLeave(evt: DragEvent) {
  (evt.currentTarget as HTMLElement).classList.remove('active');
}

onDrop(evt: DragEvent) {
  evt.preventDefault();
  (evt.currentTarget as HTMLElement).classList.remove('active'); // 👈 quita el azul
  const list = evt.dataTransfer?.files;
  list && this.process(Array.from(list));
}

  handleInput(e: Event) 
  {
    const list = (e.target as HTMLInputElement).files;
    list && this.process(Array.from(list));
    (e.target as HTMLInputElement).value = '';
  }

  private async process(files: File[]) {
    const invalid = files.filter(f => !f.name.match(/\.(zip|gz)$/i));
    if (invalid.length) {
      this.snack.open('Solo se admiten .zip o .gz', 'OK', { duration: 3000 });
      return;
    }

    await this.svc.requestOutputDirectory();
    this.files.update(o => [...o, ...files]);
    files.forEach(f => this.svc.enqueueDecompress(f));
  }

  trackBy = (_: number, f: File) => f.name;
}
