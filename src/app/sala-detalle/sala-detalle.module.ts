import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Routes } from '@angular/router';
import { SalaDetallePage } from './sala-detalle.page';
import { DocumentoEditorComponent } from './documento-editor/documento-editor.component';
import { WikiSelectorModalComponent } from '../shared/wiki-selector/wiki-selector-modal.component';

const routes: Routes = [{ path: '', component: SalaDetallePage }];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes),
    DocumentoEditorComponent,
    WikiSelectorModalComponent
  ],
  declarations: [SalaDetallePage]
})
export class SalaDetallePageModule {}