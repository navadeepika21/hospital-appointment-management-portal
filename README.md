# CarePoint — Hospital Appointment Management Portal

A beginner-friendly React + Vite + JSON Server capstone project.

## Requirements
- Node.js installed
- VS Code (recommended)

## Start the project
Open a terminal in this folder and run:

```bash
npm install
```

Terminal 1 — start JSON Server:
```bash
npm run server
```
The API is available at `http://localhost:3000`.

Terminal 2 — start React:
```bash
npm run dev
```
Open the local URL shown by Vite (usually `http://localhost:5173`).

## Features
- Dashboard calculations from API data
- Doctor CRUD, search, specialization filter and availability
- Patient CRUD and form validation
- Appointment CRUD, status changes, date/status filters
- Prevent booking unavailable doctors
- Prevent a doctor being booked for the same date and time twice
- React Router navigation
- API service layer in `src/services/api.js`
- Responsive CSS layout

## API endpoints
- GET `/doctors`, GET `/doctors/:id`, POST `/doctors`, PUT `/doctors/:id`, DELETE `/doctors/:id`
- GET `/patients`, GET `/patients/:id`, POST `/patients`, PUT `/patients/:id`, DELETE `/patients/:id`
- GET `/appointments`, GET `/appointments/:id`, POST `/appointments`, PUT `/appointments/:id`, DELETE `/appointments/:id`

The Edit buttons fetch the selected record by ID before showing its form. The app uses a local JSON file for learning/demo purposes; do not put real patient data into this demo.
