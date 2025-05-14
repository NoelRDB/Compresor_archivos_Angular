import { Component, Input, computed } from '@angular/core';
import { CompressionService } from '../../services/compression.service';
import { NgIf } from '@angular/common';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-progress-bar',
  standalone: true,
  templateUrl: './progress-bar.component.html',

  imports:[NgIf, MatProgressBarModule, MatIconModule]
})
export class ProgressBarComponent {
  @Input() file!: File;

  constructor(private compressSvc: CompressionService) {}

  private task = computed(() =>
    this.compressSvc.tasks().find(t => t.file === this.file)
  );
  progress = computed(() => this.task()?.progress ?? 0);
  done     = computed(() => !!this.task()?.done);
  error    = computed(() => this.task()?.error);
}
