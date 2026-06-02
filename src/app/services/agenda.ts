import { Injectable } from '@angular/core';
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp
} from 'firebase/firestore';

export interface Evento {
  id?: string;
  titulo: string;
  descripcion: string;
  fecha: Date;
  horaInicio: string;
  horaFin: string;
  tipo: 'entrega' | 'examen' | 'proyecto' | 'reunion' | 'personal';
  creadoPor: string;
  emailCreador: string;
  roomId?: string;
  nombreSala?: string;
  invitados: {
    [email: string]: 'pendiente' | 'aceptado' | 'rechazado';
  };
  esPersonal: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AgendaService {

  private db = getFirestore();


  /**
   * @function crearEvento
   * @description Crea un nuevo evento en la base de datos.
   */
  async crearEvento(evento: Omit<Evento, 'id'>): Promise<string> {
    const eventosRef = collection(this.db, 'eventos');
    const docRef = await addDoc(eventosRef, {
      ...evento,
      fecha: Timestamp.fromDate(evento.fecha)
    });
    return docRef.id;
  }

  /**
   * @function obtenerEventos
   * @description Obtiene todos los eventos donde el usuario es creador.
   */
  async obtenerEventos(emailUsuario: string): Promise<Evento[]> {
    const eventosRef = collection(this.db, 'eventos');

    // Eventos que creé yo
    const qCreador = query(
      eventosRef,
      where('emailCreador', '==', emailUsuario),
      orderBy('fecha', 'asc')
    );

    const snapCreador = await getDocs(qCreador);
    const eventosCreados = snapCreador.docs.map(d => ({
      id: d.id,
      ...d.data(),
      fecha: (d.data()['fecha'] as Timestamp).toDate()
    } as Evento));

    return eventosCreados;
  }

  /**
   * @function obtenerInvitaciones
   * @description Obtiene todas las invitaciones pendientes para un usuario.
   */
  async obtenerInvitaciones(emailUsuario: string): Promise<Evento[]> {
    const eventosRef = collection(this.db, 'eventos');
    const campo = `invitados.${emailUsuario.replace('.', '_')}`;

    const qInvitado = query(
      eventosRef,
      where(campo, '==', 'pendiente')
    );

    const snap = await getDocs(qInvitado);
    return snap.docs.map(d => ({
      id: d.id,
      ...d.data(),
      fecha: (d.data()['fecha'] as Timestamp).toDate()
    } as Evento));
  }

  /**
   * @function responderInvitacion
   * @description Responde a una invitación (aceptar o rechazar).
   */
  async responderInvitacion(
    eventoId: string,
    emailUsuario: string,
    respuesta: 'aceptado' | 'rechazado'
  ): Promise<void> {
    const eventoRef = doc(this.db, 'eventos', eventoId);
    const campo = `invitados.${emailUsuario.replace('.', '_')}`;
    await updateDoc(eventoRef, { [campo]: respuesta });
  }

}