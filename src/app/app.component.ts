import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatCard } from '@angular/material/card';
import { DependencyUpdaterComponent } from "./dependency-updater/dependency-updater.component";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MatCard, DependencyUpdaterComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'dust';
}
