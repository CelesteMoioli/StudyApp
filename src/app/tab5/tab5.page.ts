import { Component, OnInit, OnDestroy } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { Subscription } from 'rxjs';

import { AuthService } from '../services/auth.service';
import { DbService } from '../services/db.service';

@Component({
  selector: 'app-tab5',
  templateUrl: 'tab5.page.html',
  styleUrls: ['tab5.page.scss'],
  standalone: false,
})
export class Tab5Page implements OnInit, OnDestroy {

  perfil: any = {
    nombre: '',
    username: '',
    salas: 0,
    equipos: 0,
    recursos: 0,
    contribuciones: 0
  };

  private userEmail = '';

  private salasSub?: Subscription;
  private recursosSub?: Subscription;

  constructor(
    private alertController: AlertController,
    private auth: AuthService,
    private db: DbService
  ) {}

  async ngOnInit(): Promise<void> {

    const user = await this.auth.getCurrentUser();

    if (!user) return;

    this.userEmail = user.email;

    const datos = await this.db.getPerfil(this.userEmail);

    if (datos) {

      this.perfil = datos;

    } else {

      this.perfil = {
        nombre: user.email.split('@')[0],
        username: user.email.split('@')[0],
        salas: 0,
        equipos: 0,
        recursos: 0,
        contribuciones: 0
      };

      await this.db.setPerfil(
        this.userEmail,
        this.perfil
      );
    }

    this.cargarEstadisticas();
  }

  ngOnDestroy(): void {
    this.salasSub?.unsubscribe();
    this.recursosSub?.unsubscribe();
  }

  private cargarEstadisticas(): void {

    this.salasSub = this.db.listenSalas().subscribe(salas => {

      this.perfil.salas = salas.length;

      this.actualizarContribuciones();
    });

    this.recursosSub = this.db.listenRecursos().subscribe(recursos => {

      this.perfil.recursos = recursos.length;

      this.actualizarContribuciones();
    });

  }

  private async actualizarContribuciones(): Promise<void> {

    this.perfil.contribuciones =
      this.perfil.salas +
      this.perfil.recursos +
      this.perfil.equipos;

    await this.db.setPerfil(
      this.userEmail,
      this.perfil
    );
  }

  async editarPerfil(): Promise<void> {

    const alert = await this.alertController.create({
      header: 'Editar perfil',
      inputs: [
        {
          name: 'nombre',
          type: 'text',
          placeholder: 'Nombre',
          value: this.perfil.nombre
        },
        {
          name: 'username',
          type: 'text',
          placeholder: 'Usuario',
          value: this.perfil.username
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Guardar',
          handler: async (data) => {

            if (!data.nombre?.trim()) {
              return false;
            }

            this.perfil.nombre = data.nombre.trim();

            this.perfil.username =
              data.username?.trim() ||
              this.perfil.username;

            await this.db.setPerfil(
              this.userEmail,
              this.perfil
            );

            return true;
          }
        }
      ]
    });

    await alert.present();
  }
}