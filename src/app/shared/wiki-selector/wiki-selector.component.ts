import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { finalize } from 'rxjs';
import { WikipediaArticle, WikipediaSearchResult, WikipediaService } from '../../services/wikipedia.service';

@Component({
  selector: 'app-wiki-selector',
  templateUrl: './wiki-selector.component.html',
  styleUrls: ['./wiki-selector.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class WikiSelectorComponent {
  @Output() wikiSeleccionada = new EventEmitter<string>();

  searchTerm = '';
  results: WikipediaSearchResult[] = [];
  selectedArticle: WikipediaArticle | null = null;
  isLoading = false;
  isReadingLoading = false;
  errorMessage = '';

  constructor(private wikipediaService: WikipediaService) {}


  /**
   * @function buscar
   * @description Busca artículos en Wikipedia.
   */
  buscar(): void {
    const term = this.searchTerm.trim();
    if (!term) return;
    this.isLoading = true;
    this.errorMessage = '';
    this.results = [];
    this.selectedArticle = null;

    this.wikipediaService.search(term)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (res) => {
          this.results = res;
          this.errorMessage = res.length ? '' : 'No se encontraron resultados.';
        },
        error: () => {
          this.errorMessage = 'No pudimos conectar con Wikipedia.';
        }
      });
  }


  /**
   * @function abrirArticulo
   * @description Obtiene el artículo completo de Wikipedia.
   */
  abrirArticulo(title: string): void {
    this.isReadingLoading = true;
    this.selectedArticle = null;

    this.wikipediaService.getArticle(title)
      .pipe(finalize(() => this.isReadingLoading = false))
      .subscribe({
        next: (article) => { this.selectedArticle = article; },
        error: () => { this.errorMessage = 'No pudimos cargar el artículo.'; }
      });
  }


  /**
   * @function usarArticulo
   * @description Emite el contenido del artículo seleccionado para que pueda ser usado en el editor.
   */
  usarArticulo(): void {
    if (!this.selectedArticle) return;
    this.wikiSeleccionada.emit(this.selectedArticle.html);
  }


  /**
   * @function volver
   * @description Vuelve a la vista de resultados de búsqueda.
   */
  volver(): void {
    this.selectedArticle = null;
  }
}