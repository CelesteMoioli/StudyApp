import { Component, OnInit, OnDestroy } from '@angular/core';
import { AlertController, ModalController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { DbService } from '../services/db.service';
import { AvatarPickerComponent } from './avatar-picker/avatar-picker.component';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

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
    contribuciones: 0,
    avatarUrl: ''
  };
  private userEmail = '';
  private salasSub?: Subscription;
  private recursosSub?: Subscription;

  constructor(
    private alertController: AlertController,
    private modalController: ModalController,
    private auth: AuthService,
    private db: DbService
  ) {}

  
  /** 
  * @function ngOnInit
  * @description Inicializa el componente. 
  */
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
        contribuciones: 0,
        avatarUrl: ''
      };
      await this.db.setPerfil(this.userEmail, this.perfil);
    }
    this.cargarEstadisticas();
  }


  /** 
  * @function ngOnDestroy
  * @description Limpia las suscripciones al destruir el componente.
  */
  ngOnDestroy(): void {
    this.salasSub?.unsubscribe();
    this.recursosSub?.unsubscribe();
  }


  /** 
  * @function cargarEstadisticas
  * @description Carga las estadísticas del perfil. 
  */
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


  /** 
  * @function actualizarContribuciones
  * @description Actualiza el número de contribuciones del perfil. 
  */
  private async actualizarContribuciones(): Promise<void> {
    this.perfil.contribuciones =
      this.perfil.salas + this.perfil.recursos + this.perfil.equipos;
    await this.db.setPerfil(this.userEmail, this.perfil);
  }


  /** 
  * @function cambiarAvatar
  * @description Cambia el avatar del perfil. 
  */
  async cambiarAvatar(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Foto de perfil',
      buttons: [
  {
    text: 'Elegir avatar',
    cssClass: 'alert-button-avatar',
    handler: () => {
      this.abrirAvatarPicker();
      return false;
    }
  },
  {
    text: 'Tomar foto',
    handler: () => {
      this.tomarFoto(CameraSource.Camera);
      return false;
    }
  },
  {
    text: 'Elegir de galería',
    handler: () => {
      this.tomarFoto(CameraSource.Photos);
      return false;
    }
  },
  {
    text: 'Cancelar',
    role: 'cancel'
  }
]
    });
    await alert.present();
  }


  /** 
  * @function abrirAvatarPicker
  * @description Abre el selector de avatares. 
  */
  async abrirAvatarPicker(): Promise<void> {
    const modal = await this.modalController.create({
      component: AvatarPickerComponent,
      breakpoints: [0, 0.75, 1],
      initialBreakpoint: 0.75
    });
    await modal.present();
    const { data } = await modal.onDidDismiss();
    if (data?.avatar) {
      this.perfil.avatarUrl = data.avatar;
      await this.db.setPerfil(this.userEmail, this.perfil);
    }
  }


  /** 
  * @function tomarFoto
  * @description Toma una foto con la cámara. 
  */
  async tomarFoto(source: CameraSource): Promise<void> {
    try {
      const image = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: source
      });
      if (image.dataUrl) {
        this.perfil.avatarUrl = image.dataUrl;
        await this.db.setPerfil(this.userEmail, this.perfil);
      }
    } catch (e) {
      // usuario canceló
    }
  }


  /** 
  * @function editarPerfil
  * @description Edita el perfil del usuario. 
  */
  async editarPerfil(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Editar perfil',
      subHeader: 'Modificá tu nombre y usuario',
      inputs: [
        {
          name: 'nombre',
          type: 'text',
          placeholder: `Nombre actual: ${this.perfil.nombre}`,
          value: this.perfil.nombre,
          attributes: { label: 'Nombre' }
        },
        {
          name: 'username',
          type: 'text',
          placeholder: `Usuario actual: ${this.perfil.username}`,
          value: this.perfil.username,
          attributes: { label: 'Usuario' }
        }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Guardar',
          handler: async (data: any) => {
            if (!data.nombre?.trim()) return false;
            this.perfil.nombre = data.nombre.trim();
            this.perfil.username = data.username?.trim() || this.perfil.username;
            await this.db.setPerfil(this.userEmail, this.perfil);
            return true;
          }
        }
      ]
    });
    await alert.present();
  }
}