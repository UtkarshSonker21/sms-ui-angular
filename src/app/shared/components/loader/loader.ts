import { Component, inject } from '@angular/core';
import { AsyncPipe, NgIf } from '@angular/common';

import { LoadingService } from '../../../core/services/common/loading.service';
@Component({
  selector: 'app-loader',
  imports: [NgIf, AsyncPipe],
  templateUrl: './loader.html',
  styleUrl: './loader.scss',
})
export class Loader {

  loadingService = inject(LoadingService);

}
