import { Component, Input, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { DbService } from '../../services/db.service';

@Component({
  selector: 'app-documento-editor',
  templateUrl: './documento-editor.component.html',
  styleUrls: ['./documento-editor.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class DocumentoEditorComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() salaId!: string;
  @Input() documento: any = null;
  @Input() autor!: string;
  @Input() wikiTexto?: string;
  @Input() wikiHtml?: string;
  @Input() contenidoPrevio?: string;
  @Input() titulo = '';

  @ViewChild('editor') editorRef!: ElementRef<HTMLDivElement>;
  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;

  private autoSaveTimer: any;
  private docSub?: Subscription;

  constructor(private modalController: ModalController, private db: DbService) {}

  ngOnInit(): void {
    if (this.documento) {
      this.titulo = this.documento.titulo;
    }
  }

  ngAfterViewInit(): void {
    const editor = this.editorRef?.nativeElement;
    if (!editor) return;

    // Prioridad: contenidoPrevio > documento.contenido
    if (this.contenidoPrevio) {
      editor.innerHTML = this.contenidoPrevio;
    } else if (this.documento?.contenido) {
      editor.innerHTML = this.documento.contenido;
    }

    // Agregar contenido wiki al final
    if (this.wikiHtml) {
      editor.innerHTML += (editor.innerHTML ? '<hr>' : '') + this.wikiHtml;
    } else if (this.wikiTexto) {
      editor.innerHTML += (editor.innerHTML ? '<br>' : '') + `<p>${this.wikiTexto}</p>`;
    }

    // Escuchar cambios en tiempo real solo si es documento existente
    if (this.documento) {
      this.docSub = this.db.listenDocumentos(this.salaId).subscribe(docs => {
        const actualizado = docs.find((d: any) => d.id === this.documento.id);
        if (actualizado && actualizado.contenido !== editor.innerHTML) {
          const sel = window.getSelection();
          const range = sel?.rangeCount ? sel.getRangeAt(0) : null;
          editor.innerHTML = actualizado.contenido || '';
          this.documento = actualizado;
          if (range && editor.contains(document.activeElement)) {
            try { sel?.addRange(range); } catch {}
          }
        }
      });
    }
  }

  ngOnDestroy(): void {
    clearTimeout(this.autoSaveTimer);
    this.docSub?.unsubscribe();
  }

  cmd(command: string): void {
    document.execCommand(command, false);
    this.editorRef?.nativeElement.focus();
  }

  aplicarBloque(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    document.execCommand('formatBlock', false, value);
    this.editorRef?.nativeElement.focus();
  }

  aplicarTamano(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;
    const range = sel.getRangeAt(0);
    const span = document.createElement('span');
    span.style.fontSize = value;
    range.surroundContents(span);
    this.onCambio();
  }

  aplicarColor(event: Event): void {
    const color = (event.target as HTMLInputElement).value;
    document.execCommand('foreColor', false, color);
    this.editorRef?.nativeElement.focus();
    this.onCambio();
  }

  onKeydown(event: KeyboardEvent): void {}

  onCambio(): void {
    if (!this.documento) return;
    clearTimeout(this.autoSaveTimer);
    this.autoSaveTimer = setTimeout(() => {
      const contenido = this.editorRef?.nativeElement.innerHTML ?? '';
      this.db.actualizarDocumento(this.salaId, this.documento.id, contenido);
    }, 1000);
  }

  async guardar(): Promise<void> {
    const contenido = this.editorRef?.nativeElement.innerHTML ?? '';
    if (this.documento) {
      await this.db.actualizarDocumento(this.salaId, this.documento.id, contenido);
      this.modalController.dismiss({ guardado: true });
    } else {
      if (!this.titulo.trim()) return;
      this.db.crearDocumento(this.salaId, {
        titulo: this.titulo.trim(),
        contenido,
        autor: this.autor
      });
      this.modalController.dismiss({ guardado: true });
    }
  }

  insertarWiki(): void {
    const contenido = this.editorRef?.nativeElement.innerHTML ?? '';
    this.modalController.dismiss({ abrirWiki: true, contenidoActual: contenido, titulo: this.titulo });
  }

  insertarImagen(): void {
    this.fileInputRef?.nativeElement.click();
  }

  onImagenSeleccionada(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      const img = `<img src="${base64}" style="max-width:100%; border-radius:8px; margin:8px 0;" />`;
      this.insertarHtmlEnCursor(img);
      this.onCambio();
    };
    reader.readAsDataURL(file);
  }

  private insertarHtmlEnCursor(html: string): void {
    const editor = this.editorRef?.nativeElement;
    if (!editor) return;
    editor.focus();
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      range.deleteContents();
      const fragment = range.createContextualFragment(html);
      range.insertNode(fragment);
      range.collapse(false);
    } else {
      editor.innerHTML += html;
    }
  }

  cerrar(): void {
    this.modalController.dismiss();
  }
}