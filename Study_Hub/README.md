# StudyHub

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.2.26.

## Project structure

Application code lives in `src/app` and is organized by responsibility:

```text
src/app/
├── core/           # App-wide services, models, guards and interceptors
├── shared/         # UI reused by multiple features
├── layout/         # Shared app chrome, such as the sidebar and topbar
├── pages/          # App-wide pages, including the unknown-path page
├── features/       # Feature-specific pages and UI
│   ├── dashboard/
│   │   └── pages/
│   ├── subjects/
│   ├── tasks/
│   ├── calendar/
│   ├── pomodoro/
│   ├── notes/
│   ├── statistics/
│   ├── profile/
│   └── settings/
└── app.routes.ts   # Maps URLs to pages
```

Put feature-only code inside its feature folder. Use `shared/components` only
for UI reused by multiple features, and keep app-wide infrastructure in `core`.

## Timer

The dashboard timer starts with a 25-minute focus interval, a 5-minute short
break, and a 15-minute long break after four completed focus intervals. Its
durations and cycle length can be changed in Timer settings. Timer state and
completed focus sessions stay in memory only and reset when the page is
refreshed; only completed focus intervals contribute to the daily, weekly, and
monthly study totals.
Browser notifications and a completion sound can be enabled in Timer settings.
Subject and task labels can be entered directly in the timer.

Study tasks are also held in memory only. Add a subject, study description, and
deadline from the dashboard; tasks can be opened from the dashboard or Tasks
page to view, edit, complete, or delete them. Tasks and dashboard summaries
reset when the page is refreshed.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
