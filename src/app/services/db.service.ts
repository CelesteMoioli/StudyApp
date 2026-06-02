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

  listenSalas(): Observable<any[]> {
    return new Observable(obs => {
      onValue(ref(this.db, 'salas'), snap => {
        const val = snap.val() ?? {};
        obs.next(Object.entries(val).map(([id, data]) => ({ id, ...(data as object) })));
      });
    });
  }

  addSala(sala: { nombre: string; descripcion: string }): void {
    push(ref(this.db, 'salas'), {
      ...sala,
      fechaCreacion: new Date().toISOString().split('T')[0]
    });
  }

  // ── Presencia en sala ──────────────────────────────────────────────────────

  async joinSala(salaId: string, email: string, nombre: string): Promise<void> {
    const presRef = ref(this.db, `presencia/${salaId}/${this.userKey(email)}`);
    await set(presRef, { email, nombre });
    onDisconnect(presRef).remove();
  }

  leaveSala(salaId: string, email: string): void {
    remove(ref(this.db, `presencia/${salaId}/${this.userKey(email)}`));
  }

  listenPresencia(salaId: string): Observable<any[]> {
    return new Observable(obs => {
      onValue(ref(this.db, `presencia/${salaId}`), snap => {
        const val = snap.val() ?? {};
        obs.next(Object.values(val));
      });
    });
  }

  // ── Chat ───────────────────────────────────────────────────────────────────

  sendMessage(salaId: string, mensaje: { texto: string; autor: string; email: string }): void {
    push(ref(this.db, `chat/${salaId}`), {
      ...mensaje,
      timestamp: Date.now()
    });
  }

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

  listenAgenda(email: string): Observable<any[]> {
    return new Observable(obs => {
      onValue(ref(this.db, `agenda/${this.userKey(email)}`), snap => {
        const val = snap.val() ?? {};
        obs.next(Object.entries(val).map(([id, data]) => ({ id, ...(data as object) })));
      });
    });
  }

  addEvento(email: string, evento: { titulo: string; tipo: string; hora: string; materia: string; fecha: string }): void {
    push(ref(this.db, `agenda/${this.userKey(email)}`), evento);
  }

  // ── Recursos ───────────────────────────────────────────────────────────────

  listenRecursos(): Observable<any[]> {
    return new Observable(obs => {
      onValue(ref(this.db, 'recursos'), snap => {
        const val = snap.val() ?? {};
        obs.next(Object.entries(val).map(([id, data]) => ({ id, ...(data as object) })));
      });
    });
  }

  addRecurso(recurso: { nombre: string; tipo: string; materia: string }): void {
    push(ref(this.db, 'recursos'), {
      ...recurso,
      fechaSubida: new Date().toISOString().split('T')[0]
    });
  }

  // ── Perfil ─────────────────────────────────────────────────────────────────

  async getPerfil(email: string): Promise<any> {
    const snap = await get(ref(this.db, `usuarios/${this.userKey(email)}`));
    return snap.val();
  }

  setPerfil(email: string, perfil: any): Promise<void> {
    return set(ref(this.db, `usuarios/${this.userKey(email)}`), perfil);
  }

  // ── Seed ───────────────────────────────────────────────────────────────────

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

  listenDocumentos(salaId: string): Observable<any[]> {
    return new Observable(obs => {
      onValue(ref(this.db, `documentos/${salaId}`), snap => {
        const val = snap.val() ?? {};
        obs.next(Object.entries(val).map(([id, data]) => ({ id, ...(data as object) })));
      });
    });
  }

  crearDocumento(salaId: string, doc: { titulo: string; contenido: string; autor: string }): void {
    push(ref(this.db, `documentos/${salaId}`), {
      ...doc,
      fechaCreacion: Date.now(),
      ultimaEdicion: Date.now()
    });
  }

  actualizarDocumento(salaId: string, docId: string, contenido: string): Promise<void> {
    return update(ref(this.db, `documentos/${salaId}/${docId}`), {
      contenido,
      ultimaEdicion: Date.now()
    });
  }
}