import { TestBed } from '@angular/core/testing';

import { AgendaService } from './agenda';


  /**
   * @function describir
   * @description Pruebas unitarias para el servicio de Agenda. 
   */
describe('AgendaService', () => {
  let service: AgendaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AgendaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
