import { Component, OnInit } from '@angular/core';
import { AgendaService, Evento } from 'src/app/services/agenda';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  standalone: false,
})
export class Tab2Page implements OnInit {

  emailUsuario = 'usuario@ejemplo.com';
  mesActual: Date = new Date();
  diaSeleccionado: Date = new Date();
  diasSemana: Date[] = [];
  todosLosEventos: Evento[] = [];
  eventosDia: Evento[] = [];
  invitacionesPendientes: Evento[] = [];

  nombresDias = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
  nombresMeses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  constructor(private agendaService: AgendaService) {}

  ngOnInit() {
    this.generarSemana(this.diaSeleccionado);
    this.cargarEventos();
  }

  generarSemana(fecha: Date) {
    const inicio = new Date(fecha);
    const diaSemana = inicio.getDay();
    inicio.setDate(inicio.getDate() - diaSemana);
    this.diasSemana = [];
    for (let i = 0; i < 7; i++) {
      const dia = new Date(inicio);
      dia.setDate(inicio.getDate() + i);
      this.diasSemana.push(dia);
    }
  }

mesAnterior() {
  this.mesActual = new Date(this.mesActual.getFullYear(), this.mesActual.getMonth() - 1, 1);
  this.diaSeleccionado = new Date(this.mesActual);
  this.generarSemana(this.diaSeleccionado);
  this.filtrarEventosDia();
}

mesSiguiente() {
  this.mesActual = new Date(this.mesActual.getFullYear(), this.mesActual.getMonth() + 1, 1);
  this.diaSeleccionado = new Date(this.mesActual);
  this.generarSemana(this.diaSeleccionado);
  this.filtrarEventosDia();
}

semanaAnterior() {
  const nueva = new Date(this.diaSeleccionado);
  nueva.setDate(nueva.getDate() - 7);
  this.diaSeleccionado = nueva;
  this.mesActual = new Date(nueva.getFullYear(), nueva.getMonth(), 1);
  this.generarSemana(nueva);
  this.filtrarEventosDia();
}

semanaSiguiente() {
  const nueva = new Date(this.diaSeleccionado);
  nueva.setDate(nueva.getDate() + 7);
  this.diaSeleccionado = nueva;
  this.mesActual = new Date(nueva.getFullYear(), nueva.getMonth(), 1);
  this.generarSemana(nueva);
  this.filtrarEventosDia();
}

  seleccionarDia(dia: Date) {
    this.diaSeleccionado = dia;
    this.mesActual = new Date(dia.getFullYear(), dia.getMonth(), 1);
    this.filtrarEventosDia();
  }

  esDiaSeleccionado(dia: Date): boolean {
    return dia.toDateString() === this.diaSeleccionado.toDateString();
  }

  esHoy(dia: Date): boolean {
    return dia.toDateString() === new Date().toDateString();
  }

  tieneEventos(dia: Date): boolean {
    return this.todosLosEventos.some(e =>
      new Date(e.fecha).toDateString() === dia.toDateString()
    );
  }

  filtrarEventosDia() {
    this.eventosDia = this.todosLosEventos.filter(e =>
      new Date(e.fecha).toDateString() === this.diaSeleccionado.toDateString()
    );
  }

  async cargarEventos() {
    try {
      this.todosLosEventos = await this.agendaService.obtenerEventos(this.emailUsuario);
      this.invitacionesPendientes = await this.agendaService.obtenerInvitaciones(this.emailUsuario);
      this.filtrarEventosDia();
    } catch (error) {
      console.log('Error cargando eventos:', error);
    }
  }

  get mesAnioTexto(): string {
    return `${this.nombresMeses[this.mesActual.getMonth()]} ${this.mesActual.getFullYear()}`;
  }

  colorTipo(tipo: string): string {
    const colores: any = {
      entrega: 'purple',
      examen: 'green',
      proyecto: 'orange',
      reunion: 'blue',
      personal: 'blue'
    };
    return colores[tipo] || 'blue';
  }

  colorTextoTipo(tipo: string): string {
    const colores: any = {
      entrega: 'purplefont',
      examen: 'greenfont',
      proyecto: 'orangefont',
      reunion: 'bluefont',
      personal: 'bluefont'
    };
    return colores[tipo] || 'bluefont';
  }

  async responder(evento: Evento, respuesta: 'aceptado' | 'rechazado') {
    if (!evento.id) return;
    await this.agendaService.responderInvitacion(evento.id, this.emailUsuario, respuesta);
    await this.cargarEventos();
  }

  abrirCrearEvento() {
    console.log('Abrir modal para crear evento');
  }

}