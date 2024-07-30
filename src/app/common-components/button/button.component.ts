import { Component } from '@angular/core';
import {MatRippleModule} from '@angular/material/core';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [MatRippleModule],
  templateUrl: './button.component.html',
  styleUrl: './button.component.scss'
})
export class ButtonComponent {

}
