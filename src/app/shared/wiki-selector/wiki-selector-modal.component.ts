import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController } from '@ionic/angular';
import { WikiSelectorComponent } from './wiki-selector.component';

@Component({
  selector: 'app-wiki-selector-modal',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, WikiSelectorComponent],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Buscar en Wikipedia</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="cerrar()">
            <ion-icon name="close-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <app-wiki-selector (wikiSeleccionada)="seleccionar($event)"></app-wiki-selector>
    </ion-content>
  `
})
export class WikiSelectorModalComponent {
  constructor(private modalController: ModalController) {}

  seleccionar(html: string): void {
    this.modalController.dismiss({ wikiHtml: html });
  }

  cerrar(): void {
    this.modalController.dismiss();
  }
}