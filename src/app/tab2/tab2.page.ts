import { Component, OnDestroy, OnInit } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { DbService } from '../services/db.service';
import { AuthService } from '../services/auth.service';

interface DiaSemana {
  nombre: string;
  num: number;
  fecha: string;
}

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  standalone: false,
})
export class Tab2Page implements OnInit, OnDestroy {
  eventos: any[] = [];
  weekDays: DiaSemana[] = [];
  selectedDate = '';
  today = new Date().toISOString().split('T')[0];
  private weekStart = new Date();
  private sub?: Subscription;
  private userEmail = '';

  private readonly DIAS = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];
  private readonly MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

  tipoColor: Record<string, string> = {
    'Entrega': 'purple', 'Examen': 'green', 'Proyecto': 'orange', 'Reunión': 'blue'
  };
  tipoFontClass: Record<string, string> = {
    'Entrega': 'purplefont', 'Examen': 'greenfont', 'Proyecto': 'orangefont', 'Reunión': 'bluefont'
  };

  constructor(
    private alertController: AlertController,
    private db: DbService,
    private auth: AuthService
  ) {}

  async ngOnInit(): Promise<void> {
    this.setWeek(new Date());
    this.selectedDate = this.today;

    const user = await this.auth.getCurrentUser();
    if (!user) return;
    this.userEmail = user.email;
    this.sub = this.db.listenAgenda(this.userEmail).subscribe(e => this.eventos = e);
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  get mesActual(): string {
    return `${this.MESES[this.weekStart.getMonth()]} ${this.weekStart.getFullYear()}`;
  }

  get eventosFiltrados(): any[] {
    if (!this.selectedDate) return this.eventos;
    return this.eventos.filter(e => e.fecha === this.selectedDate);
  }

  setWeek(ref: Date): void {
    const d = new Date(ref);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    this.weekStart = new Date(d);

    this.weekDays = this.DIAS.map((nombre, i) => {
      const fecha = new Date(d);
      fecha.setDate(d.getDate() + i);
      return {
        nombre,
        num: fecha.getDate(),
        fecha: fecha.toISOString().split('T')[0]
      };
    });
  }

  prevWeek(): void {
    const d = new Date(this.weekStart);
    d.setDate(d.getDate() - 7);
    this.setWeek(d);
  }

  nextWeek(): void {
    const d = new Date(this.weekStart);
    d.setDate(d.getDate() + 7);
    this.setWeek(d);
  }

  selectDay(fecha: string): void {
    this.selectedDate = this.selectedDate === fecha ? '' : fecha;
  }

  isToday(fecha: string): boolean {
    return fecha === this.today;
  }

  isSelected(fecha: string): boolean {
    return fecha === this.selectedDate;
  }

  getCardClass(tipo: string): string {
    return this.tipoColor[tipo] ?? 'blue';
  }

  getFontClass(tipo: string): string {
    return this.tipoFontClass[tipo] ?? 'bluefont';
  }

  async nuevoEvento(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Nuevo evento',
      inputs: [
        { name: 'titulo', type: 'text', placeholder: 'Título' },
        { name: 'materia', type: 'text', placeholder: 'Materia' },
        { name: 'fecha', type: 'date', value: this.selectedDate },
        { name: 'hora', type: 'text', placeholder: 'Hora (ej: 10:00)' },
        { name: 'tipo', type: 'text', placeholder: 'Tipo (Entrega, Examen, Proyecto, Reunión)' },
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Guardar',
          handler: (data) => {
            if (!data.titulo?.trim()) return false;
            this.db.addEvento(this.userEmail, {
              titulo: data.titulo.trim(),
              materia: data.materia?.trim() ?? '',
              fecha: data.fecha ?? '',
              hora: data.hora?.trim() ?? '',
              tipo: data.tipo?.trim() ?? 'Entrega'
            });
            return true;
          }
        }
      ]
    });
    await alert.present();
  }
}
