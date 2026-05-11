import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Tab1Page } from './tab1.page';

const routes: Routes = [
  { path: '', component: Tab1Page },
  {
    path: 'sala/:id/:nombre',
    loadChildren: () => import('../sala-detalle/sala-detalle.module').then(m => m.SalaDetallePageModule)
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class Tab1PageRoutingModule {}
