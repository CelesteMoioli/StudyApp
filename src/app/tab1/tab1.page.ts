import { Component } from '@angular/core';
import { AlertController, IonButton} from '@ionic/angular';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: false,
})
export class Tab1Page {

  constructor(
    private alertController: AlertController
  ) {}

async MostrarConsola()  {
  let alerta = await this.alertController.create({
    header: "Ingresar texto",
    inputs: [
      {
        type: "text",
        name: "titulo",
        placeholder: "Ingresar texto deseado",

      }
      
    ],
    buttons: [
      {
        text: "Cancelar",
        role: "cancel"
      },
      {
        text: "Imprimir",
        handler: (data) => {
          console.log(data.titulo);
        }
      }
    ]
  })

  await alerta.present();

}

}
