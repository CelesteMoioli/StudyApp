import { Injectable, inject } from '@angular/core';
import { Database, ref, push, get, set, update, onValue, remove } from '@angular/fire/database';
import { onDisconnect } from 'firebase/database';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DbService {
  private db = inject(Database);

  private userKey(email: string): string {
    return email.replace(/\./g, ',');
  }

  // ── Salas ──────────────────────────────────────────────────────────────────


  /**
   * @function listenSalas
   * @description Escucha los cambios en la lista de salas.
   */
  listenSalas(): Observable<any[]> {
    return new Observable(obs => {
      onValue(ref(this.db, 'salas'), snap => {
        const val = snap.val() ?? {};
        obs.next(Object.entries(val).map(([id, data]) => ({ id, ...(data as object) })));
      });
    });
  }


  /**
   * @function addSala
   * @description Agrega una nueva sala a la base de datos.
   */
  addSala(sala: { nombre: string; descripcion: string }): void {
    push(ref(this.db, 'salas'), {
      ...sala,
      fechaCreacion: new Date().toISOString().split('T')[0]
    });
  }

  // ── Presencia en sala ──────────────────────────────────────────────────────

  /**
   * @function joinSala
   * @description Permite a un usuario unirse a una sala.
   */
  async joinSala(salaId: string, email: string, nombre: string): Promise<void> {
    const presRef = ref(this.db, `presencia/${salaId}/${this.userKey(email)}`);
    await set(presRef, { email, nombre });
    onDisconnect(presRef).remove();
  }


  /**
   * @function leaveSala
   * @description Permite a un usuario salir de una sala.
   */
  leaveSala(salaId: string, email: string): void {
    remove(ref(this.db, `presencia/${salaId}/${this.userKey(email)}`));
  }


  /**
   * @function listenPresencia
   * @description Escucha los cambios en la lista de usuarios en una sala.
   */
  listenPresencia(salaId: string): Observable<any[]> {
    return new Observable(obs => {
      onValue(ref(this.db, `presencia/${salaId}`), snap => {
        const val = snap.val() ?? {};
        obs.next(Object.values(val));
      });
    });
  }

  // ── Chat ───────────────────────────────────────────────────────────────────
  /**
   * @function sendMessage
   * @description Envía un mensaje a una sala.
   */
  sendMessage(salaId: string, mensaje: { texto: string; autor: string; email: string }): void {
    push(ref(this.db, `chat/${salaId}`), {
      ...mensaje,
      timestamp: Date.now()
    });
  }


  /**
   * @function listenChat
   * @description Escucha los cambios en la lista de mensajes de una sala.
   */
  listenChat(salaId: string): Observable<any[]> {
    return new Observable(obs => {
      onValue(ref(this.db, `chat/${salaId}`), snap => {
        const val = snap.val() ?? {};
        const mensajes = Object.entries(val)
          .map(([id, data]) => ({ id, ...(data as object) }))
          .sort((a: any, b: any) => a.timestamp - b.timestamp);
        obs.next(mensajes);
      });
    });
  }

  // ── Agenda ─────────────────────────────────────────────────────────────────

    /**
   * @function listenAgenda
   * @description Escucha los cambios en la lista de eventos de una persona.
   */
  listenAgenda(email: string): Observable<any[]> {
    return new Observable(obs => {
      onValue(ref(this.db, `agenda/${this.userKey(email)}`), snap => {
        const val = snap.val() ?? {};
        obs.next(Object.entries(val).map(([id, data]) => ({ id, ...(data as object) })));
      });
    });
  }


  /**
   * @function addEvento
   * @description Agrega un nuevo evento a la agenda de una persona.
   */
  addEvento(email: string, evento: { titulo: string; tipo: string; hora: string; materia: string; fecha: string }): void {
    push(ref(this.db, `agenda/${this.userKey(email)}`), evento);
  }

  // ── Recursos ───────────────────────────────────────────────────────────────

  /**
   * @function listenRecursos
   * @description Escucha los cambios en la lista de recursos.
   */
  listenRecursos(): Observable<any[]> {
    return new Observable(obs => {
      onValue(ref(this.db, 'recursos'), snap => {
        const val = snap.val() ?? {};
        obs.next(Object.entries(val).map(([id, data]) => ({ id, ...(data as object) })));
      });
    });
  }


  /**
   * @function addRecurso
   * @description Agrega un nuevo recurso a la base de datos.
   */
  addRecurso(recurso: { nombre: string; tipo: string; materia: string }): void {
    push(ref(this.db, 'recursos'), {
      ...recurso,
      fechaSubida: new Date().toISOString().split('T')[0]
    });
  }

  // ── Perfil ─────────────────────────────────────────────────────────────────

  /**
   * @function getPerfil
   * @description Obtiene el perfil de un usuario.
   */
  async getPerfil(email: string): Promise<any> {
    const snap = await get(ref(this.db, `usuarios/${this.userKey(email)}`));
    return snap.val();
  }


  /**
   * @function setPerfil
   * @description Establece el perfil de un usuario.
   */
  setPerfil(email: string, perfil: any): Promise<void> {
    return set(ref(this.db, `usuarios/${this.userKey(email)}`), perfil);
  }

  // ── Seed ───────────────────────────────────────────────────────────────────

  /**
   * @function seed
   * @description Llena la base de datos con datos de ejemplo si está vacía.
   */
  async seed(): Promise<void> {
    const salasSnap = await get(ref(this.db, 'salas'));
    if (!salasSnap.exists()) {
      const salas = [
        { nombre: 'Matemáticas', descripcion: 'Grupo de estudio de cálculo y álgebra', fechaCreacion: '2026-04-20' },
        { nombre: 'Física', descripcion: 'Grupo de estudio de mecánica y termodinámica', fechaCreacion: '2026-04-21' },
        { nombre: 'Programación', descripcion: 'Grupo de desarrollo de aplicaciones', fechaCreacion: '2026-04-22' },
        { nombre: 'Historia', descripcion: 'Grupo de historia contemporánea', fechaCreacion: '2026-04-23' },
        { nombre: 'Sala de Bases de Datos', descripcion: 'Grupo de estudio', fechaCreacion: '2026-04-28' },
      ];
      for (const sala of salas) push(ref(this.db, 'salas'), sala);
    }


    /**
   * @function resourcesSeed
   * @description Llena la base de datos con recursos de ejemplo si no existen.
   */
    const recursosSnap = await get(ref(this.db, 'recursos'));
    if (!recursosSnap.exists()) {
      const recursos = [
        { nombre: 'Formulario integrales.pdf', materia: 'Matemáticas', tipo: 'PDF', fechaSubida: '2026-05-10' },
        { nombre: 'Presentación Ondas.pptx', materia: 'Física', tipo: 'PPTX', fechaSubida: '2026-05-09' },
        { nombre: 'Guía de Algoritmos.docx', materia: 'Programación', tipo: 'DOCX', fechaSubida: '2026-05-08' },
        { nombre: 'Clase 5 - Cinemática.mp4', materia: 'Física', tipo: 'MP4', fechaSubida: '2026-05-07' },
      ];
      for (const recurso of recursos) push(ref(this.db, 'recursos'), recurso);
    }
  }

  // ── Documentos colaborativos ──────────────────────────────────────────────

  /**
   * @function listenDocumentos
   * @description Escucha los cambios en la lista de documentos.
   */
  listenDocumentos(salaId: string): Observable<any[]> {
    return new Observable(obs => {
      onValue(ref(this.db, `documentos/${salaId}`), snap => {
        const val = snap.val() ?? {};
        obs.next(Object.entries(val).map(([id, data]) => ({ id, ...(data as object) })));
      });
    });
  }


  /**
   * @function crearDocumento
   * @description Crea un nuevo documento en la base de datos.
   */
  crearDocumento(salaId: string, doc: { titulo: string; contenido: string; autor: string }): void {
    push(ref(this.db, `documentos/${salaId}`), {
      ...doc,
      fechaCreacion: Date.now(),
      ultimaEdicion: Date.now()
    });
  }


  /**
   * @function actualizarDocumento
   * @description Actualiza un documento existente en la base de datos.
   */
  actualizarDocumento(salaId: string, docId: string, contenido: string): Promise<void> {
    return update(ref(this.db, `documentos/${salaId}/${docId}`), {
      contenido,
      ultimaEdicion: Date.now()
    });
  }
}