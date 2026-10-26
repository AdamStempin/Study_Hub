# StudyHub — Angular application

StudyHub is a responsive study planner with a dashboard, task management, and
a Pomodoro timer. The repository overview and feature guide are in the
[top-level README](../README.md).

## Requirements

- Node.js with npm
- Dependencies installed from this directory

## Development

```bash
npm install
npm start
```

Open [http://localhost:4200](http://localhost:4200). The development server
reloads the application when source files change.

## Build and tests

```bash
npm run build
npm test -- --watch=false
```

The unit tests use Vitest through Angular's unit-test builder.

## Routes

| Path | Page |
| --- | --- |
| `/` | Study dashboard |
| `/tasks` | Task list |
| `/tasks/:id` | Task details and editing |
| `/timer` | Pomodoro workspace |

## Source structure

```text
src/app/
├── app.routes.ts
├── core/                         # Application-level infrastructure
├── layout/
│   └── sidebar/                  # Navigation shared across pages
├── features/
│   ├── dashboard/pages/
│   ├── tasks/
│   │   ├── models/
│   │   ├── pages/
│   │   └── services/
│   └── pomodoro/
│       ├── components/
│       ├── models/
│       ├── pages/
│       └── services/
├── pages/not-found/
└── shared/components/
```

## Current data behavior

The task and Pomodoro services use Angular Signals to hold in-memory state.
Tasks, settings, and completed sessions currently reset on a full page reload.
Completed focus intervals are used to calculate daily, weekly, and monthly
study totals, recent sessions, and study time grouped by subject.

## Notes

- The dashboard and timer use the same shared sidebar and Pomodoro service.
- Subjects, Calendar, and Settings are sidebar placeholders, not separate
  implemented routes.
- Browser notifications depend on user permission. The completion sound
  requires browser audio support.
