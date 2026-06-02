import { Component, OnDestroy, OnInit } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { DbService } from '../services/db.service';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: false,
})
export class Tab1Page implements OnInit, OnDestroy {
  salas: any[] = [];
  private sub?: Subscription;

  private avatarColors = ['avatar-purple', 'avatar-indigo', 'avatar-green', 'avatar-orange'];
  private avatarIcons = ['calculator-outline', 'flask-outline', 'code-slash-outline', 'receipt-outline'];

  constructor(private alertController: AlertController, private db: DbService, private router: Router) {}


/** 
* @function ngOnInit
* @description Inicializa el componente y suscribe a los cambios en las salas. 
*/
  ngOnInit(): void {
    this.sub = this.db.listenSalas().subscribe(salas => this.salas = salas);
  }


/** 
* @function ngOnDestroy
* @description Limpia las suscripciones cuando el componente se destruye. 
*/
  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }


/** 
* @function getColor
* @description Devuelve el color para el avatar según el índice. 
*/
  getColor(index: number): string {
    return this.avatarColors[index % this.avatarColors.length];
  }


/** 
* @function getIcon
* @description Devuelve el icono para el avatar según el índice. 
*/
  getIcon(index: number): string {
    return this.avatarIcons[index % this.avatarIcons.length];
  }


/** 
* @function abrirSala
* @description Navega a la vista de una sala específica. 
*/
  abrirSala(sala: any): void {
    this.router.navigate(['/tabs/tab1/sala', sala.id, sala.nombre]);
  }


/** 
* @function nuevaSala
* @description Abre un cuadro de diálogo para crear una nueva sala. 
*/
  async nuevaSala(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Nueva sala',
      inputs: [
        { name: 'nombre', type: 'text', placeholder: 'Nombre de la sala' },
        { name: 'descripcion', type: 'text', placeholder: 'Descripción' },
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Crear',
          handler: (data) => {
            if (!data.nombre?.trim()) return false;
            this.db.addSala({ nombre: data.nombre.trim(), descripcion: data.descripcion?.trim() ?? '' });
            return true;
          }
        }
      ]
    });
    await alert.present();
  }
}
