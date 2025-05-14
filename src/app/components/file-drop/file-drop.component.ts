import { Component, Input, signal } from '@angular/core';
import { CompressionService } from '../../services/compression.service';
import { ProgressBarComponent } from "../progress-bar/progress-bar.component";


@Component({
  selector: 'app-file-drop',
  standalone: true,
  templateUrl: './file-drop.component.html',
  styleUrls: ['./file-drop.component.scss'],
  imports: [ProgressBarComponent],
})
export class FileDropComponent {
  readonly files = signal<File[]>([]);
  @Input() file: any;

  constructor(private compressSvc: CompressionService) {}

  onFiles(evt: DragEvent | Event) {
    const list: FileList | null =
      'dataTransfer' in evt
        ? evt.dataTransfer?.files ?? null
        : (evt.target as HTMLInputElement).files;

    if (!list) return;

    const arr = Array.from(list);
    this.files.update(old => [...old, ...arr]);
    arr.forEach(f => this.compressSvc.enqueue(f)); // gzip por defecto
  }
}
