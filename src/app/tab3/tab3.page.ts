import { Component, OnDestroy, OnInit } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { DbService } from '../services/db.service';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  standalone: false,
})
export class Tab3Page implements OnInit, OnDestroy {
  recursos: any[] = [];
  private sub?: Subscription;

  tipoClass: Record<string, string> = {
    'PDF': 'pdf',
    'PPTX': 'ppt',
    'DOCX': 'doc',
    'MP4': 'video'
  };

  constructor(private alertController: AlertController, private db: DbService) {}

  ngOnInit(): void {
    this.sub = this.db.listenRecursos().subscribe(recursos => this.recursos = recursos);
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  getIconClass(tipo: string): string {
    return this.tipoClass[tipo?.toUpperCase()] ?? 'doc';
  }

  isVideo(tipo: string): boolean {
    return tipo?.toUpperCase() === 'MP4';
  }

  async nuevoRecurso(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Nuevo recurso',
      inputs: [
        { name: 'nombre', type: 'text', placeholder: 'Nombre del archivo' },
        { name: 'materia', type: 'text', placeholder: 'Materia' },
        { name: 'tipo', type: 'text', placeholder: 'Tipo (PDF, PPTX, DOCX, MP4)' },
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Agregar',
          handler: (data) => {
            if (!data.nombre?.trim()) return false;
            this.db.addRecurso({
              nombre: data.nombre.trim(),
              materia: data.materia?.trim() ?? '',
              tipo: data.tipo?.trim().toUpperCase() ?? 'DOC'
            });
            return true;
          }
        }
      ]
    });
    await alert.present();
  }
}
