import { Component, inject } from '@angular/core';
import { Footer } from "../components/footer/footer";
import { Sidebar } from "../components/sidebar/sidebar";
import { Header } from "../components/header/header";
import { RouterOutlet } from "@angular/router";
import { AuthService } from '../../core/services/common/auth.service';

@Component({
  selector: 'app-main-layout',
  imports: [Sidebar, Header, RouterOutlet],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss',
})
export class MainLayout {
  private authService = inject(AuthService);

  ngOnInit(): void {
    this.authService.handleApplicationStartup();
  }
}
