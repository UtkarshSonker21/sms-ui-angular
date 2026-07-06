import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Loader } from "./shared/components/loader/loader";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Loader],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('sms-ui');
}
