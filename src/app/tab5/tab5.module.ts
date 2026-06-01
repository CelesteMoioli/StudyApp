import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Tab5Page } from './tab5.page';
import { ExploreContainerComponentModule } from '../explore-container/explore-container.module';
import { Tab5PageRoutingModule } from './tab5-routing.module';
import { AvatarPickerComponent } from './avatar-picker/avatar-picker.component';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    ExploreContainerComponentModule,
    Tab5PageRoutingModule,
    AvatarPickerComponent
  ],
  declarations: [Tab5Page]
})
export class Tab5PageModule {}