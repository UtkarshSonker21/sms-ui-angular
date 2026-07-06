import { Component } from '@angular/core';
import { Footer } from "../components/footer/footer";
import { Sidebar } from "../components/sidebar/sidebar";
import { Header } from "../components/header/header";
import { RouterOutlet } from "@angular/router";

@Component({
  selector: 'app-main-layout',
  imports: [Sidebar, Header, RouterOutlet],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss',
})
export class MainLayout {}
