import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IonContent, ModalController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { DbService } from '../services/db.service';
import { DocumentoEditorComponent } from './documento-editor/documento-editor.component';
import { WikiSelectorModalComponent } from '../shared/wiki-selector/wiki-selector-modal.component';

@Component({
  selector: 'app-sala-detalle',
  templateUrl: 'sala-detalle.page.html',
  styleUrls: ['sala-detalle.page.scss'],
  standalone: false,
})
export class SalaDetallePage implements OnInit, OnDestroy {
  @ViewChild(IonContent) content!: IonContent;
  salaId = '';
  salaNombre = '';
  mensajes: any[] = [];
  presencia: any[] = [];
  documentos: any[] = [];
  nuevoMensaje = '';
  userEmail = '';
  userName = '';

  private chatSub?: Subscription;
  private presSub?: Subscription;
  private docSub?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private auth: AuthService,
    private db: DbService,
    private modalController: ModalController
  ) {}

  async ngOnInit(): Promise<void> {
    this.salaId = this.route.snapshot.paramMap.get('id') ?? '';
    this.salaNombre = this.route.snapshot.paramMap.get('nombre') ?? '';
    const user = await this.auth.getCurrentUser();
    if (!user) return;
    this.userEmail = user.email;
    this.userName = user.email.split('@')[0];
    await this.db.joinSala(this.salaId, this.userEmail, this.userName);
    this.presSub = this.db.listenPresencia(this.salaId).subscribe(p => this.presencia = p);
    this.chatSub = this.db.listenChat(this.salaId).subscribe(msgs => {
      this.mensajes = msgs;
      setTimeout(() => this.content?.scrollToBottom(200), 50);
    });
    this.docSub = this.db.listenDocumentos(this.salaId).subscribe(docs => {
      this.documentos = docs;
    });
  }

  ngOnDestroy(): void {
    this.db.leaveSala(this.salaId, this.userEmail);
    this.chatSub?.unsubscribe();
    this.presSub?.unsubscribe();
    this.docSub?.unsubscribe();
  }

  enviar(): void {
    const texto = this.nuevoMensaje.trim();
    if (!texto) return;
    this.db.sendMessage(this.salaId, {
      texto,
      autor: this.userName,
      email: this.userEmail
    });
    this.nuevoMensaje = '';
  }

  esMio(msg: any): boolean {
    return msg.email === this.userEmail;
  }

  async nuevoDocumento(): Promise<void> {
    await this.abrirEditor(null);
  }

  async abrirDocumento(doc: any): Promise<void> {
    await this.abrirEditor(doc);
  }

  private async abrirEditor(documento: any): Promise<void> {
    const modal = await this.modalController.create({
      component: DocumentoEditorComponent,
      componentProps: {
        salaId: this.salaId,
        autor: this.userName,
        documento: documento ?? null
      }
    });

    modal.onDidDismiss().then(async ({ data }) => {
      if (data?.abrirWiki) {
        const wikiHtml = await this.abrirWikiModal();
        if (wikiHtml) {
          await this.abrirEditorConWiki(documento, data.titulo, data.contenidoActual, wikiHtml);
        }
      }
    });

    await modal.present();
  }

  private async abrirEditorConWiki(documento: any, titulo: string, contenidoActual: string, wikiHtml: string): Promise<void> {
    const modal = await this.modalController.create({
      component: DocumentoEditorComponent,
      componentProps: {
        salaId: this.salaId,
        autor: this.userName,
        documento: documento ?? null,
        wikiHtml,
        titulo,
        contenidoPrevio: contenidoActual
      }
    });

    modal.onDidDismiss().then(async ({ data }) => {
      if (data?.abrirWiki) {
        const wikiHtml2 = await this.abrirWikiModal();
        if (wikiHtml2) {
          await this.abrirEditorConWiki(documento, data.titulo, data.contenidoActual, wikiHtml2);
        }
      }
    });

    await modal.present();
  }

  private async abrirWikiModal(): Promise<string | null> {
    const modal = await this.modalController.create({
      component: WikiSelectorModalComponent
    });
    await modal.present();
    const { data } = await modal.onDidDismiss();
    return data?.wikiHtml ?? null;
  }
}