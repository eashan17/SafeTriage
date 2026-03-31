# SafeTriage AI

SafeTriage AI is a human-in-the-loop artificial intelligence triage system designed to provide a full audit trail. It empowers healthcare workers to efficiently and accurately maintain patient data, specifically when conditions are critical, by quickly identifying the severity of a patient's symptoms.

## Real Use Case

In crowded emergency departments, under-resourced rural clinics, or disaster-response scenarios, health workers are often overwhelmed with a high volume of patients. Quick and accurate triaging is the key to saving lives. 

When a critical patient arrives, **SafeTriage AI** helps workers by:
1. **Data Capture:** Allowing nurses, doctors, or first responders to quickly input vital signs, symptoms, and medical history.
2. **AI-Assisted Triaging:** Providing an immediate, AI-generated triage confidence score and a transparent clinical explanation to assess the severity.
3. **Prioritization:** Helping staff identify and immediately escalate life-threatening conditions over non-urgent cases.
4. **Accountability (Human-in-the-loop):** Keeping a permanent audit trail of both the AI's recommendation and the ultimate decision made by the human healthcare professional, ensuring safety and compliance.

## Project Structure

The repository is structured as a full-stack application:

* **`backend/`**: Contains the Python/FastAPI backend API. It houses the core machine learning inference logic (`/predict`), medical heuristic checks, and the SQLite-based audit trail (`/audit`).
* **`frontend/`**: The web-based user interface, developed using React, Vite, and Tailwind CSS. It provides a sleek, responsive dashboard for health workers to submit patient data and review triage reports.
* **`tasks/`**: Contains scripts or workflows for background processing, maintenance, or data seeding.
* **`.agents/`**: Houses AI agent skills and configurations (e.g., scaffolding, code cleanup workflows) used during project development.

## Getting Started

### Backend
1. Navigate to the `backend/` directory.
2. Install dependencies: `pip install -r requirements.txt`
3. Run the FastAPI development server: `python -m uvicorn app.main:app --reload --port 8080`

### Frontend
1. Navigate to the `frontend/` directory.
2. Install dependencies: `npm install`
3. Start the Vite development server: `npm run dev`
