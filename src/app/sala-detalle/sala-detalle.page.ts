import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IonContent } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { DbService } from '../services/db.service';

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
  nuevoMensaje = '';
  userEmail = '';
  userName = '';

  private chatSub?: Subscription;
  private presSub?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private auth: AuthService,
    private db: DbService
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
  }

  ngOnDestroy(): void {
    this.db.leaveSala(this.salaId, this.userEmail);
    this.chatSub?.unsubscribe();
    this.presSub?.unsubscribe();
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
}
