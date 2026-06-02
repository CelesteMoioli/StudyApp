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
  recursosFiltrados: any[] = [];

  filtroSeleccionado = 'Todos';
  textoBusqueda = '';

  private sub?: Subscription;

  tipoClass: Record<string, string> = {
    PDF: 'pdf',
    PPTX: 'ppt',
    DOCX: 'doc',
    MP4: 'video'
  };

  constructor(
    private alertController: AlertController,
    private db: DbService
  ) {}


  /** 
  * @function ngOnInit
  * @description Inicializa el componente y configura los recursos. 
  */
  ngOnInit(): void {
    this.sub = this.db.listenRecursos().subscribe(recursos => {
      this.recursos = recursos;
      this.aplicarFiltro();
    });
  }


  /** 
  * @function ngOnDestroy
  * @description Limpia la suscripción al destruir el componente. 
  */
  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }


  /** 
  * @function getIconClass
  * @description Devuelve la clase CSS para el icono del recurso según su tipo. 
  */
  getIconClass(tipo: string): string {
    return this.tipoClass[tipo?.toUpperCase()] ?? 'doc';
  }


  /** 
  * @function isVideo
  * @description Devuelve true si el recurso es un video. 
  */
  isVideo(tipo: string): boolean {
    return tipo?.toUpperCase() === 'MP4';
  }


  /** 
  * @function seleccionarFiltro
  * @description Selecciona un filtro para los recursos. 
  */
  seleccionarFiltro(filtro: string): void {
    this.filtroSeleccionado = filtro;
    this.aplicarFiltro();
  }


  /** 
  * @function buscar
  * @description Busca recursos por nombre o materia. 
  */
  buscar(event: any): void {
    this.textoBusqueda = event.detail.value ?? '';
    this.aplicarFiltro();
  }


  /** 
  * @function aplicarFiltro
  * @description Aplica el filtro seleccionado a los recursos. 
  */
  aplicarFiltro(): void {

    let resultado = [...this.recursos];

    switch (this.filtroSeleccionado) {

      case 'Documentos':
        resultado = resultado.filter(r =>
          ['PDF', 'DOCX'].includes(
            r.tipo?.toUpperCase()
          )
        );
        break;

      case 'Presentaciones':
        resultado = resultado.filter(r =>
          ['PPT', 'PPTX'].includes(
            r.tipo?.toUpperCase()
          )
        );
        break;

      case 'Videos':
        resultado = resultado.filter(r =>
          ['MP4', 'AVI', 'MOV'].includes(
            r.tipo?.toUpperCase()
          )
        );
        break;
    }

    if (this.textoBusqueda.trim()) {

      const texto = this.textoBusqueda.toLowerCase();

      resultado = resultado.filter(r =>
        r.nombre?.toLowerCase().includes(texto) ||
        r.materia?.toLowerCase().includes(texto)
      );
    }

    this.recursosFiltrados = resultado;
  }


  /** 
  * @function nuevoRecurso
  * @description Crea un nuevo recurso. 
  */
  async nuevoRecurso(): Promise<void> {

    const alert = await this.alertController.create({
      header: 'Nuevo recurso',
      inputs: [
        {
          name: 'nombre',
          type: 'text',
          placeholder: 'Nombre del archivo'
        },
        {
          name: 'materia',
          type: 'text',
          placeholder: 'Materia'
        },
        {
          name: 'tipo',
          type: 'text',
          placeholder: 'Tipo (PDF, PPTX, DOCX, MP4)'
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Agregar',
          handler: (data) => {

            if (!data.nombre?.trim()) {
              return false;
            }

            this.db.addRecurso({
              nombre: data.nombre.trim(),
              materia: data.materia?.trim() ?? '',
              tipo: data.tipo?.trim().toUpperCase() ?? 'DOCX'
            });

            return true;
          }
        }
      ]
    });

    await alert.present();
  }
}