import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';

@Component({
  selector: 'app-avatar-picker',
  templateUrl: './avatar-picker.component.html',
  styleUrls: ['./avatar-picker.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class AvatarPickerComponent implements OnInit {
  avatares: string[] = [];
  avatarSeleccionado: string = '';

  private seeds = [
  'Felix', 'Luna', 'Max', 'Sofia', 'Luca',
  'Mia', 'Bruno', 'Valentina', 'Diego', 'Emma',
  'Tomas', 'Camila', 'Mateo', 'Isabella', 'Santiago',
  'Pedro', 'Julia', 'Nico', 'Martina', 'Agustin',
  'Florencia', 'Ramiro', 'Belen', 'Franco', 'Lucia',
  'Ignacio', 'Abril', 'Facundo', 'Rocio', 'Ezequiel'
];

  constructor(private modalController: ModalController) {}

  ngOnInit(): void {
    this.avatares = this.seeds.map(seed =>
      `https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}`
    );
  }

  seleccionar(avatar: string): void {
    this.avatarSeleccionado = avatar;
  }

  confirmar(): void {
    this.modalController.dismiss({ avatar: this.avatarSeleccionado });
  }

  cerrar(): void {
    this.modalController.dismiss();
  }
}