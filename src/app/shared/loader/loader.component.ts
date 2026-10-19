import { Component, HostBinding, Input } from '@angular/core';

@Component({
  selector: 'app-loader',
  standalone: true,
  templateUrl: './loader.component.html',
  styleUrl: './loader.component.scss'
})
export class LoaderComponent {
  @Input() message = 'Loading…';
  @Input() compact = false;
  @Input() inline = false;

  @HostBinding('class.inline-host')
  get inlineHost(): boolean {
    return this.inline;
  }
}
