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

  ngOnInit(): void {
    this.sub = this.db.listenSalas().subscribe(salas => this.salas = salas);
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  getColor(index: number): string {
    return this.avatarColors[index % this.avatarColors.length];
  }

  getIcon(index: number): string {
    return this.avatarIcons[index % this.avatarIcons.length];
  }

  abrirSala(sala: any): void {
    this.router.navigate(['/tabs/tab1/sala', sala.id, sala.nombre]);
  }

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
