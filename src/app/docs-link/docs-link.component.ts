import { Component,ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-docs-link',
  standalone: true,
  imports: [],
  templateUrl: './docs-link.component.html',
  host: {class: 'flex basis-full w-full h-full'},
  styleUrl: './docs-link.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DocsLinkComponent {

}
