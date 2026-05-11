import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';

export interface WikipediaSearchResult {
  title: string;
  description: string;
  url: string;
}

export interface WikipediaArticle {
  title: string;
  html: string;
  url: string;
}

interface WikipediaArticleResponse {
  parse?: {
    displaytitle?: string;
    title?: string;
    text?: {
      '*': string;
    };
  };
}

@Injectable({
  providedIn: 'root'
})
export class WikipediaService {
  private readonly apiUrl = 'https://es.wikipedia.org/w/api.php';

  constructor(private http: HttpClient) {}

  search(term: string): Observable<WikipediaSearchResult[]> {
    // Busqueda corta para armar el listado de temas. Usamos Wikipedia en espanol como API publica.
    const params = new HttpParams()
      .set('action', 'opensearch')
      .set('search', term.trim())
      .set('limit', '5')
      .set('namespace', '0')
      .set('format', 'json')
      .set('origin', '*');

    return this.http.get<[string, string[], string[], string[]]>(this.apiUrl, { params }).pipe(
      map((response) => {
        const titles = response[1] ?? [];
        const descriptions = response[2] ?? [];
        const urls = response[3] ?? [];

        return titles.map((title, index) => ({
          title,
          description: descriptions[index] || 'Sin descripción disponible.',
          url: urls[index] || ''
        }));
      })
    );
  }

  getArticle(title: string): Observable<WikipediaArticle> {
    // Traemos el articulo completo en HTML para leerlo dentro de StudyApp, sin abrir otra app o navegador.
    const params = new HttpParams()
      .set('action', 'parse')
      .set('page', title.trim())
      .set('prop', 'text|displaytitle')
      .set('disableeditsection', '1')
      .set('disabletoc', '1')
      .set('mobileformat', '1')
      .set('redirects', '1')
      .set('format', 'json')
      .set('origin', '*');

    return this.http.get<WikipediaArticleResponse>(this.apiUrl, { params }).pipe(
      map((response) => {
        return {
          title: response.parse?.title || title,
          html: this.normalizeArticleHtml(response.parse?.text?.['*'] || '<p>No hay contenido disponible para este tema.</p>'),
          url: `https://es.wikipedia.org/wiki/${encodeURIComponent(response.parse?.title || title)}`
        };
      })
    );
  }

  private normalizeArticleHtml(html: string): string {
    // Wikipedia devuelve enlaces e imagenes con rutas relativas; aca las dejamos listas para Ionic.
    return html
      .replace(/href="\/wiki\//g, 'href="https://es.wikipedia.org/wiki/')
      .replace(/src="\/\//g, 'src="https://')
      .replace(/<span class="mw-editsection".*?<\/span>/gs, '')
      .replace(/\{\\displaystyle\s*([^}]+)\}/g, '$1')
      .replace(/\\displaystyle/g, '')
      .replace(/\\left|\\right|\\!|\\,/g, '')
      .replace(/\\leq/g, '&le;')
      .replace(/\\geq/g, '&ge;')
      .replace(/\\frac/g, 'frac');
  }
}
