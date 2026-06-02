# Avance de Proyecto - Módulo de Agenda (Celeste)

## 1. Tareas Realizadas
En esta etapa, me enfoqué en la configuración inicial de la infraestructura para la agenda colaborativa y la personalización de la interfaz de navegación.

### Configuración de Firebase
- **Instalación de dependencias:** Se integraron las librerías `@angular/fire` y `firebase` para permitir la comunicación con Firestore.
- **Preparación de Entornos:** Se modificó `src/environments/environment.ts` para incluir la estructura de credenciales de Firebase (quedando a la espera de las Keys finales del equipo de backend).
- **Inicialización Global:** Se configuró `src/app/app.module.ts` para inicializar la aplicación de Firebase al arrancar la app.

### Interfaz de Usuario (UI)
- **Navegación por Tabs:** Se personalizó el componente `tabs.page.html`.
- **Iconografía:** Se reemplazaron los íconos genéricos por íconos semánticos de *Ionicons* (`calendar`, `people`, `library`, etc.) para mejorar la experiencia de usuario (UX).
- **Localización:** Se tradujeron las etiquetas de los botones de navegación al español.

## 2. Estructura de Datos Propuesta (Firestore)
Para el sistema de invitaciones tipo Gmail, se planea utilizar la siguiente estructura:
- **Colección `events`**: Almacenará título, fecha, creador y un objeto de `invitados` con sus estados (pendiente/aceptado/rechazado).

## 3. Próximos Pasos
1. Implementar el `AgendaService` para el CRUD de eventos.
2. Crear el formulario de "Nuevo Evento" con buscador de usuarios.