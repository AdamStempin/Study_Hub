# StudyHub 🎓

**Your studies. Your goals. Your progress.**

StudyHub is a modern web application designed to help students organize their academic life, manage school responsibilities, and improve their productivity. It combines task management, subject organization, calendar planning, note-taking, and study time tracking in one convenient platform.

## ✨ Features

- **Dashboard** – Get an overview of your subjects, upcoming deadlines, daily tasks, and study progress.
- **Subject Management** – Create and organize subjects, teachers, and related study materials.
- **Task Management** – Create assignments, set priorities and deadlines, and track completion status.
- **Academic Calendar** – Plan exams, tests, projects, and other important events.
- **Pomodoro Timer** – Improve concentration with focused study sessions and scheduled breaks.
- **Notes** – Create, organize, and manage notes for individual subjects.
- **Statistics** – Track study time, completed assignments, and productivity over time.
- **User Accounts** – Manage personal information and keep academic data associated with your account.
- **Dark and Light Mode** – Customize the appearance of the application.
- **Responsive Design** – Access the application on desktop computers, tablets, and mobile devices.

## 🛠️ Technologies

The planned technology stack includes:

### Frontend
- Angular
- TypeScript
- HTML5
- CSS3
- Angular Signals
- Angular Router
- Reactive Forms

### Backend
- ASP.NET Core Web API
- C#

### Database
- PostgreSQL or SQLite
- Entity Framework Core

*The final technology stack may change during development.*

## 🚀 Project Status

**Status:** In Development

StudyHub is being developed as a secondary school research project (SOČ). The goal is to build a functional, user-friendly application that demonstrates modern web development practices and solves a practical problem faced by students.

Features will be implemented progressively throughout development.

## 🎯 Project Goals

The main objectives of StudyHub are to:

- Help students organize their academic responsibilities.
- Improve time management and study planning.
- Reduce the risk of missing important deadlines.
- Encourage consistent study habits.
- Provide useful insights into learning progress.
- Demonstrate full-stack web application development.

## ⚙️ Getting Started

### Prerequisites

Before running the project, make sure you have installed:

- [Node.js](https://nodejs.org/)
- npm
- [Angular CLI](https://angular.dev/tools/cli)

The backend and database will require additional tools once their implementation is complete.

### Installation

Clone the repository:

```bash
git clone <https://github.com/AdamStempin/Study_Hub>
```

Navigate to the project directory:

```bash
cd StudyHub
```

Install dependencies:

```bash
npm install
```

Start the Angular development server:

```bash
ng serve
```

Open your browser and navigate to:

`http://localhost:4200/`

**Note:** These instructions apply to the Angular frontend. Additional setup steps may be required when the backend and database are integrated.

## 📁 Project Structure

The planned Angular project structure is organized by functionality:

```text
src/
└── app/
    ├── core/
    │   ├── guards/
    │   ├── interceptors/
    │   ├── services/
    │   └── models/
    ├── shared/
    │   └── components/
    ├── layout/
    │   ├── sidebar/
    │   └── topbar/
    ├── features/
    │   ├── dashboard/
    │   ├── subjects/
    │   ├── tasks/
    │   ├── calendar/
    │   ├── pomodoro/
    │   ├── notes/
    │   ├── statistics/
    │   ├── profile/
    │   └── settings/
    └── app.routes.ts
```

This structure is a proposed architecture and may evolve during development.

## 🔐 Security

Security is an important part of the project. The planned implementation includes secure authentication, password hashing, server-side validation, and authorization checks to protect users' personal data.

Sensitive credentials and environment configuration must never be committed to the repository.

## 🔮 Future Improvements

Potential future enhancements include:

- Browser notifications and deadline reminders.
- Advanced productivity analytics.
- Exporting statistics and study plans.
- Recurring tasks.
- Calendar integrations.
- Progressive Web App support.
- Offline access to selected features.

## 🎓 Educational Purpose

StudyHub is being developed as part of a secondary school research project (SOČ). It provides practical experience with Angular, TypeScript, REST APIs, database design, authentication, responsive interfaces, and software testing.

## 📄 License

No open-source license has been selected yet.

---

**StudyHub – Organize your studies. Stay focused. Achieve your goals.**
