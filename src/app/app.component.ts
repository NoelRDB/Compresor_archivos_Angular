import { Component } from '@angular/core';
import { FileDropComponent } from "./components/file-drop/file-drop.component";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FileDropComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'ng-compressor';
}
