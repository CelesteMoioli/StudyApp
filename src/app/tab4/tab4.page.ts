import { Component, ElementRef, ViewChild } from '@angular/core';
import { IonContent } from '@ionic/angular';
import { finalize } from 'rxjs';
import { WikipediaArticle, WikipediaSearchResult, WikipediaService } from '../services/wikipedia.service';

interface SubjectShortcut {
  name: string;
  icon: string;
  color: string;
  query: string;
}

interface ReadingPoint {
  position: number;
  progress: number;
  updatedAt?: string;
}

@Component({
  selector: 'app-tab4',
  templateUrl: 'tab4.page.html',
  styleUrls: ['tab4.page.scss'],
  standalone: false,
})
export class Tab4Page {
  @ViewChild(IonContent) private content?: IonContent;
  @ViewChild('readerArticle') private readerArticle?: ElementRef<HTMLElement>;

  // Claves propias de StudyApp para guardar progreso y favoritos sin mezclar datos con otras pantallas.
  private readonly progressPrefix = 'studyapp:wiki-progress:';
  private readonly favoritesKey = 'studyapp:wiki-favorites';
  private readonly recentKey = 'studyapp:wiki-recent';

  searchTerm = 'Teorema de Taylor';
  results: WikipediaSearchResult[] = [];
  selectedArticle: WikipediaArticle | null = null;
  isLoading = false;
  isReadingLoading = false;
  errorMessage = '';
  readerErrorMessage = '';
  readerMessage = '';
  readingProgress = 0;
  readerSearchTerm = '';
  showReaderSearch = false;
  showReaderMenu = false;
  expandedLibrary: 'recent' | 'favorites' | 'shared' | null = null;
  favoriteTitles: string[] = [];
  recentTitles: string[] = [];
  sharedTitles: string[] = [];
  featured = [
    'Teorema de Taylor',
    'Leyes de Newton',
    'Complejidad algorítmica',
    'Línea de tiempo - Revoluciones'
  ];
  subjects: SubjectShortcut[] = [
    { name: 'Matemática', icon: 'calculator-outline', color: 'primary-dark', query: 'matemática' },
    { name: 'Física', icon: 'planet-outline', color: 'primary', query: 'física' },
    { name: 'Programación', icon: 'code-slash', color: 'secondary', query: 'programación' },
    { name: 'Historia', icon: 'business', color: 'info', query: 'historia' }
  ];

  constructor(private wikipediaService: WikipediaService) {
    this.favoriteTitles = this.loadFavorites();
    this.recentTitles = this.loadRecent();
  }


  /** 
  * @function ionViewDidEnter
  * @description Cuando la vista se muestra, si no hay resultados cargados, realiza una búsqueda inicial para mostrar algo de contenido.
  */
  ionViewDidEnter(): void {
    if (this.results.length === 0) {
      this.searchWikipedia();
    }
  }


  /** 
  * @function ionViewWillLeave
  * @description Al salir de la vista, aseguramos salir del modo lector para no afectar otras pantallas. 
  */
  ionViewWillLeave(): void {
    this.setReaderMode(false);
  }


  /** 
  * @function selectSubject
  * @description Selecciona un tema de la lista de materias. 
  */
  selectSubject(query: string): void {
    this.searchTerm = query;
    this.selectedArticle = null;
    this.searchWikipedia();
  }


  /** 
  * @function toggleLibrary
  * @description Alterna la visibilidad de una sección de la biblioteca. 
  */
  toggleLibrary(section: 'recent' | 'favorites' | 'shared'): void {
    this.expandedLibrary = this.expandedLibrary === section ? null : section;
  }


  /** 
  * @function searchWikipedia
  * @description Realiza una búsqueda en Wikipedia. 
  */
  searchWikipedia(): void {
    const term = this.searchTerm.trim();

    if (!term) {
      this.errorMessage = 'Ingresá un tema para buscar.';
      this.results = [];
      this.selectedArticle = null;
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.readerErrorMessage = '';
    this.readerMessage = '';
    this.selectedArticle = null;

    this.wikipediaService.search(term)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (results) => {
          this.results = results;
          this.errorMessage = results.length ? '' : 'No se encontraron resultados.';
        },
        error: () => {
          this.results = [];
          this.errorMessage = 'No pudimos conectar con Wikipedia.';
        }
      });
  }


  /** 
  * @function openArticle
  * @description Abre un artículo para lectura. Carga el contenido y muestra el modo lector.
  */
  openArticle(title: string): void {
    // Cuando el usuario elige un tema, lo traemos desde Wikipedia y abrimos el lector interno.
    // La idea es que no salga de StudyApp para poder estudiar sin perder el hilo.
    this.isReadingLoading = true;
    this.setReaderMode(true);
    this.readerErrorMessage = '';
    this.readerMessage = '';
    this.readingProgress = 0;
    this.readerSearchTerm = '';
    this.showReaderSearch = false;
    this.showReaderMenu = false;

    this.wikipediaService.getArticle(title)
      .pipe(finalize(() => this.isReadingLoading = false))
      .subscribe({
        next: (article) => {
          this.selectedArticle = article;
          this.rememberRecent(article.title);
          setTimeout(() => this.restoreReadingPoint(article.title), 150);
        },
        error: () => {
          this.setReaderMode(false);
          this.readerErrorMessage = 'No pudimos cargar la lectura. Probá de nuevo.';
        }
      });
  }


  /** 
  * @function closeArticle
  * @description Cierra el artículo actual y vuelve al listado. 
  */
  closeArticle(): void {
    // Antes de volver al listado guardamos donde quedo leyendo, asi puede retomar despues.
    this.saveReadingPoint(undefined, this.readingProgress, false);
    this.selectedArticle = null;
    this.setReaderMode(false);
    this.readerErrorMessage = '';
    this.readerMessage = '';
    setTimeout(() => this.scrollToTop(), 0);
  }


  /** 
  * @function scrollToTop
  * @description Desplaza la vista al inicio del artículo.
  */
  scrollToTop(): void {
    this.content?.scrollToTop(350);
  }


  /** 
  * @function scrollPage
  * @description Desplaza la página hacia arriba o abajo.
  */
  scrollPage(direction: 1 | -1): void {
    // Mueve la lectura por tramos, no directo al inicio o al final. Asi se siente mas natural.
    this.content?.getScrollElement().then((element) => {
      const step = element.clientHeight * 0.72;
      this.content?.scrollToPoint(0, element.scrollTop + (step * direction), 280);
    });
  }

  
  /** 
  * @function handleReaderScroll
  * @description Maneja el evento de desplazamiento en el lector.
  */
  handleReaderScroll(event: CustomEvent): void {
    // Cada scroll actualiza el porcentaje leido y lo guarda en LocalStorage.
    // Esto cumple con el almacenamiento local pedido y mejora la experiencia de lectura.
    if (!this.selectedArticle) {
      return;
    }

    const detail = event.detail as { scrollTop?: number; clientHeight?: number };
    const scrollTop = detail.scrollTop ?? 0;
    const article = this.readerArticle?.nativeElement;
    const articleTop = article?.offsetTop ?? 0;
    const articleHeight = article?.scrollHeight ?? 0;
    const maxScroll = Math.max(articleTop + articleHeight - (detail.clientHeight ?? 0), 1);
    this.readingProgress = Math.min(100, Math.max(0, Math.round((scrollTop / maxScroll) * 100)));
    this.saveReadingPoint(scrollTop, this.readingProgress, false);
  }


  /** 
  * @function toggleReaderSearch
  * @description Alterna la visibilidad de la búsqueda en el lector. 
  */
  toggleReaderSearch(): void {
    this.showReaderSearch = !this.showReaderSearch;
    this.showReaderMenu = false;
    this.readerMessage = '';
  }


  /** 
  * @function toggleReaderMenu
  * @description Alterna la visibilidad del menú en el lector. 
  */
  toggleReaderMenu(): void {
    this.showReaderMenu = !this.showReaderMenu;
  }


  /** 
  * @function closeReaderMenu
  * @description Cierra el menú del lector. 
  */
  closeReaderMenu(): void {
    this.showReaderMenu = false;
  }


  /** 
  * @function findInArticle
  * @description Busca un término dentro del artículo. 
  */
  findInArticle(): void {
    // Busqueda simple dentro del articulo: ayuda a ubicar palabras clave sin irse de la lectura.
    const term = this.readerSearchTerm.trim().toLowerCase();
    const article = this.readerArticle?.nativeElement;

    if (!term || !article) {
      return;
    }

    const match = Array.from(article.querySelectorAll('p, li, h2, h3, h4')).find((element) =>
      element.textContent?.toLowerCase().includes(term)
    ) as HTMLElement | undefined;

    if (!match) {
      this.readerMessage = `No encontramos "${this.readerSearchTerm}" en esta lectura.`;
      return;
    }

    this.content?.scrollToPoint(0, Math.max(match.offsetTop - 88, 0), 350);
  }


  /** 
  * @function saveReadingPoint
  * @description Guarda el punto de lectura en el almacenamiento local. 
  */
  saveReadingPoint(scrollTop?: number, progress = this.readingProgress, showMessage = true): void {
    // Guarda la posicion exacta del lector y el porcentaje visible para mostrarlo en favoritos/resultados.
    if (!this.selectedArticle) {
      return;
    }


    /** 
    * @function save
    * @description Función interna para guardar el progreso de lectura.
    */
    const save = (position: number) => {
      localStorage.setItem(this.progressKey(this.selectedArticle!.title), JSON.stringify({
        position,
        progress,
        updatedAt: new Date().toISOString()
      }));

      if (showMessage) {
        this.readerMessage = `Punto guardado (${progress}%).`;
        this.showReaderMenu = false;
      }
    };

    if (typeof scrollTop === 'number') {
      save(scrollTop);
      return;
    }

    this.content?.getScrollElement().then((element) => save(element.scrollTop));
  }


  /** 
  * @function getSavedProgress
  * @description Devuelve el progreso guardado para un artículo específico. 
  */
  getSavedProgress(title: string): number {
    return this.loadReadingPoint(title)?.progress ?? 0;
  }


  /** 
  * @function isFavorite
  * @description Devuelve si un artículo está en favoritos. 
  */
  isFavorite(title: string): boolean {
    return this.favoriteTitles.includes(title);
  }


  /** 
  * @function toggleFavorite
  * @description Alterna la visibilidad del menú en el lector. 
  */
  toggleFavorite(title = this.selectedArticle?.title): void {
    // Favoritos queda guardado localmente; por ahora es personal del dispositivo.
    if (!title) {
      return;
    }

    this.favoriteTitles = this.isFavorite(title)
      ? this.favoriteTitles.filter((item) => item !== title)
      : [title, ...this.favoriteTitles];

    localStorage.setItem(this.favoritesKey, JSON.stringify(this.favoriteTitles));
    this.readerMessage = this.isFavorite(title) ? 'Tema agregado a favoritos.' : 'Tema quitado de favoritos.';
    this.showReaderMenu = false;
  }

  
  /** 
  * @function shareArticle
  * @description Comparte el artículo actual usando la función nativa del dispositivo o copiando el enlace. 
  */
  async shareArticle(): Promise<void> {
    // Si el celular tiene compartir nativo lo usamos; si no, dejamos el link copiado.
    if (!this.selectedArticle) {
      return;
    }

    const shareData = {
      title: this.selectedArticle.title,
      text: `Te comparto este tema de StudyApp: ${this.selectedArticle.title}`,
      url: this.selectedArticle.url
    };
    const nav = navigator as Navigator & { share?: (data: typeof shareData) => Promise<void> };

    if (nav.share) {
      await nav.share(shareData);
      this.showReaderMenu = false;
      return;
    }

    await navigator.clipboard?.writeText(`${shareData.text} ${shareData.url}`);
    this.readerMessage = 'Link copiado para compartir.';
    this.showReaderMenu = false;
  }


  /** 
  * @function shareToRooms
  * @description Comparte el tema actual en las salas de estudio.
  */
  shareToRooms(): void {
    // Boton preparado para cuando agreguemos salas: hoy deja clara la accion futura sin romper flujo.
    if (!this.selectedArticle) {
      return;
    }

    this.readerMessage = 'Tema listo para compartir en salas cuando activemos esa sección.';
  }


  /** 
  * @function restoreReadingPoint
  * @description Restaura el punto de lectura para un artículo específico. 
  */
  private restoreReadingPoint(title: string): void {
    // Al reabrir un tema, StudyApp busca el ultimo punto guardado y vuelve a esa posicion.
    const saved = this.loadReadingPoint(title);

    if (!saved || saved.progress < 2) {
      this.scrollToTop();
      return;
    }

    this.readingProgress = saved.progress;
    this.content?.scrollToPoint(0, saved.position, 450);
    this.readerMessage = `Retomaste desde el ${saved.progress}% de la lectura.`;
  }


  /** 
  * @function loadReadingPoint
  * @description Devuelve el punto de lectura guardado para un artículo específico. 
  */
  private loadReadingPoint(title: string): ReadingPoint | null {
    const raw = localStorage.getItem(this.progressKey(title));

    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as ReadingPoint;
    } catch {
      return null;
    }
  }


  /** 
  * @function loadFavorites
  * @description Devuelve la lista de artículos favoritos. 
  */
  private loadFavorites(): string[] {
    try {
      const favorites = JSON.parse(localStorage.getItem(this.favoritesKey) || '[]');
      return Array.isArray(favorites) ? favorites.filter((item): item is string => typeof item === 'string') : [];
    } catch {
      return [];
    }
  }


  /** 
  * @function rememberRecent
  * @description Recuerda el título del artículo visitado recientemente. 
  */
  private rememberRecent(title: string): void {
    this.recentTitles = [title, ...this.recentTitles.filter((item) => item !== title)].slice(0, 5);
    localStorage.setItem(this.recentKey, JSON.stringify(this.recentTitles));
  }


  /** 
  * @function loadRecent
  * @description Devuelve la lista de artículos visitados recientemente. 
  */
  private loadRecent(): string[] {
    try {
      const recent = JSON.parse(localStorage.getItem(this.recentKey) || '[]');
      return Array.isArray(recent) ? recent.filter((item): item is string => typeof item === 'string') : [];
    } catch {
      return [];
    }
  }


  /** 
  * @function progressKey
  * @description Devuelve la clave para el punto de lectura de un artículo específico. 
  */
  private progressKey(title: string): string {
    return `${this.progressPrefix}${title}`;
  }

  
  /** 
  * @function setReaderMode
  * @description Establece el modo de lectura. 
  */
  private setReaderMode(active: boolean): void {
    window.dispatchEvent(new CustomEvent('studyapp-reader-mode', { detail: active }));
  }
}
