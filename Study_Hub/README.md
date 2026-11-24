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

## Data and privacy

Study tasks are stored in Cloud Firestore under the signed-in user's account.
Firebase Authentication supports email/password and Google sign-in, and
Firestore rules restrict each account to its own tasks. Pomodoro settings and
completed focus sessions remain in browser memory and reset on a full page
reload.

### Firebase setup

The Firebase Web SDK and project configuration are already included. Before
using cloud tasks:

1. In Firebase Console, enable **Authentication → Sign-in method → Email/Password**
   and **Google**.
2. Create a **Cloud Firestore** database for the configured Firebase project.
3. From this directory, sign in with Firebase CLI and deploy the checked-in
   Firestore rules:

   ```bash
   npx firebase-tools login
   npx firebase-tools deploy --only firestore:rules --project study-hub-2027
   ```

The rules in `firestore.rules` restrict reads and writes to the authenticated
account's own `users/{uid}/tasks` collection. Do not deploy Firestore with
permissive test-mode rules. Add any production app domain to Firebase
Authentication's authorized domains before deploying the app.

## Notes

- The dashboard and timer use the same shared sidebar and Pomodoro service.
- Subjects, Calendar, and Settings are sidebar placeholders, not separate
  implemented routes.
- Browser notifications depend on user permission. The completion sound
  requires browser audio support.
