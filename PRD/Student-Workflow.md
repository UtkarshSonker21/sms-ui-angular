# Student Application Workflow - Product Requirement Document (PRD) & Technical Design

## Purpose
This document defines the complete lifecycle of a student scholarship application after it reaches the University within the Scholarship Management System (SMS). 

### Single State Machine Architecture
Although the original business requirement document separated the workflow into three independent statuses:
1. **Acceptance Status**
2. **Awarding Status**
3. **Sponsoring Status**

The system implementation intentionally consolidates these into a **single, unified `ApplicationStatus` column**. Because a student application can only be in one active stage at any given point in time, a single state machine is the most robust and elegant solution.

#### Why This Design Was Selected:
* **Simpler Database Design:** Eliminates the need to manage multiple status columns, cross-column constraints, and historical tracking across separate fields.
* **Easier Backend Implementation:** Transitions are governed by a single state transition matrix, avoiding complex conditional logic.
* **Simpler Angular UI:** The UI needs to query only one status value to determine the appropriate view, section visibility, and action triggers.
* **Easier Reporting:** Queries for reporting do not need complex joins or multiple conditions to identify the active stage of an application.
* **Easier Filtering:** Dashboard filters can be implemented with a single dropdown field listing the possible application statuses.
* **Easier Permissions:** Role-based access control (RBAC) is simplified since permissions map directly to specific states in a single workflow.
* **Easier Maintenance:** Debugging, expanding, or modifying the flow only requires editing one state machine rather than reconciling three out-of-sync status columns.
* **Mutual Exclusivity:** At any point in time, only one current status can exist. Multiple active statuses would introduce logical contradictions.

---

## High-Level Workflow

Below is the visual state machine representing the lifecycle of a student's application.

```text
Student Applies
        │
        ▼
AcceptanceInProcess
        │
        ├──────────────► AcceptanceRejected ❌
        │                   (Blocked - Student cannot apply again)
        │
        ▼
Accepted
        │
        ▼
AwardingInProcess
        │
        ├──────────────► AwardingRejected ❌
        │                   (Blocked - Student cannot apply again)
        │
        ▼
Awarded
        │
        ▼
SponsoringInProcess
        │
        ├──────────────► SponsoringRejected ❌
        │                   (Blocked - Student cannot apply again)
        │
        ▼
Sponsored
        │
        ▼
Registered
        │
        ▼
Graduated
```

### State Explanations

| State | Description |
| :--- | :--- |
| **AcceptanceInProcess** | The initial state after submission. The university is actively verifying basic eligibility and documentation. |
| **AcceptanceRejected** | The application failed initial document verification. The workflow terminates, and the student is blocked from resubmitting. |
| **Accepted** | Academic acceptance is complete. The application is ready to transition to the Awarding phase. |
| **AwardingInProcess** | The university is verifying additional local and government academic/equivalency requirements. |
| **AwardingRejected** | The application was rejected during the awarding verification phase. The workflow terminates, and the student is blocked. |
| **Awarded** | Academic/equivalency checks are fully complete. The application is queued for financial evaluation. |
| **SponsoringInProcess** | The Direct Aid Committee is reviewing the application for financial sponsorship. |
| **SponsoringRejected** | Financial sponsorship was denied by the Direct Aid Committee. The workflow terminates, and the student is blocked. |
| **Sponsored** | The Direct Aid Committee has approved the financial sponsorship. The application returns to the university for final administration. |
| **Registered** | The university has uploaded the final award letter and registered the student in the academic system. |
| **Graduated** | The student has successfully completed their studies. This represents the successful completion of the workflow. |

---

## Stage 1 - Acceptance

### Purpose
The **Acceptance** stage represents the University's initial administrative review. At this stage, the university verifies the physical and digital documents submitted by the student, including:
* **Passport**
* **High School Certificate**
* **English Certificate**
* **Other submitted files**

> [!NOTE]
> Acceptance is purely based on document verification and academic admission requirements. It does not guarantee that a scholarship will be awarded or funded.

### UI Behaviour
To streamline the reviewer's workspace, the Acceptance action buttons are displayed **immediately below the Submitted Documents section**, as this is where the reviewer performs their verification.

#### UI Placement Example:
```text
Submitted Documents
---------------------------------
✓ Passport
✓ High School Certificate
✓ English Certificate
...

---------------------------------

Acceptance Decision

[ Accept ]   [ Reject ]
```

### Acceptance Decisions
* **Accept:** Clicking **Accept** updates the status:
  $$\text{ApplicationStatus} \leftarrow \text{Accepted}$$
  * **Result:** The acceptance action buttons disappear from the document section, and the workflow automatically transitions to the **Awarding** stage.
* **Reject:** Clicking **Reject** updates the status:
  $$\text{ApplicationStatus} \leftarrow \text{AcceptanceRejected}$$
  * **Effects:**
    * The student's record is marked as blocked.
    * The student cannot submit another application.
    * The workflow terminates immediately.

---

## Stage 2 - Awarding

### Purpose
Academic acceptance alone does not grant a final scholarship award. Before the final award can be issued, additional university and government requirements must be satisfied. 

#### Examples:
* Certificate equivalency verification from the Ministry of Education.
* Formal admission approval.
* Additional internal university verifications.

### UI Behaviour
Unlike Stage 1, the Awarding actions do not map directly to a specific document section. Reviewers must scroll through comprehensive profile details to verify academic compliance. Therefore, these actions are housed inside a **Sticky Footer** at the bottom of the page, ensuring they are always accessible regardless of scroll position.

#### UI Placement Example:
```text
-----------------------------------------------------
Current Status : Accepted

[ Mark In Process ]   [ Award ]   [ Reject ]
-----------------------------------------------------
```

### Action Behaviours
1. **Mark In Process:**
   * **Action:** Sets $\text{ApplicationStatus} = \text{AwardingInProcess}$.
   * **Purpose:** Signals to other administrators that the university is actively verifying and processing the award details.
2. **Award:**
   * **Action:** Sets $\text{ApplicationStatus} = \text{Awarded}$.
   * **Purpose:** Signifies that all university-side requirements are successfully completed. The application is now forwarded to the Direct Aid Committee.
3. **Reject:**
   * **Action:** Sets $\text{ApplicationStatus} = \text{AwardingRejected}$.
   * **Effects:**
    * The workflow terminates.
    * The student is blocked and cannot apply again.

---

## Stage 3 - Sponsoring

### Purpose
At this point, the University has fully completed its academic and eligibility checks. The application is now handed over to the **Direct Aid Committee**.

> [!IMPORTANT]
> The Direct Aid Committee is **not** responsible for academic admission or eligibility verification. Their sole responsibility is evaluating the financial feasibility and approving the **financial sponsorship** of the student.

### UI Behaviour
To maintain a unified user experience, the same page interface is reused. The system automatically updates the options presented in the **Sticky Footer** based on the current application status.

#### UI Placement Example:
```text
-----------------------------------------------------
Current Status : Awarded

[ Mark In Process ]   [ Sponsor ]   [ Reject ]
-----------------------------------------------------
```

### Action Behaviours
1. **Mark In Process:**
   * **Action:** Sets $\text{ApplicationStatus} = \text{SponsoringInProcess}$.
   * **Purpose:** Indicates the committee has started reviewing the financial allocation for this student.
2. **Sponsor:**
   * **Action:** Sets $\text{ApplicationStatus} = \text{Sponsored}$.
   * **Purpose:** Approves the scholarship funding. The responsibility transitions back to the university for enrollment.
3. **Reject:**
   * **Action:** Sets $\text{ApplicationStatus} = \text{SponsoringRejected}$.
   * **Effects:**
    * The workflow terminates.
    * The student is blocked and cannot apply again.

---

## Stage 4 - Registration

### Purpose
Once the Direct Aid Committee approves the financial sponsorship ($\text{ApplicationStatus} = \text{Sponsored}$), the University resumes responsibility. The university must upload the final scholarship award letter and officially register the student in their academic systems.

### UI Behaviour
The actions in the **Sticky Footer** change to focus on administrative registration tasks.

#### UI Placement Example:
```text
-----------------------------------------------------
Current Status : Sponsored

[ Upload Award Letter ]   [ Register Student ]
-----------------------------------------------------
```

### Action Behaviours
* **Upload Award Letter:** Allows the administrator to attach the formal award letter to the student's profile.
* **Register Student:** Transition state once registration is finalized.
  $$\text{ApplicationStatus} \leftarrow \text{Registered}$$

---

## Stage 5 - Graduation

### Purpose
This is the final administrative phase. Once the student completes their academic program and graduates, the University updates their status to complete the scholarship lifecycle.

### Action Behaviour
* **Graduate Student:** Clicking this button updates the status:
  $$\text{ApplicationStatus} \leftarrow \text{Graduated}$$
* **Result:** The workflow is marked as fully completed.

---

## Sticky Footer State Rules

The table below outlines the deterministic logic governing the visibility of actions in the Sticky Footer based on the active `ApplicationStatus`:

| Current Status | Visible Actions | Target Status | Role |
| :--- | :--- | :--- | :--- |
| **AcceptanceInProcess** | Accept, Reject | `Accepted`, `AcceptanceRejected` | University |
| **Accepted** | Mark Awarding In Process, Award, Reject | `AwardingInProcess`, `Awarded`, `AwardingRejected` | University |
| **AwardingInProcess** | Award, Reject | `Awarded`, `AwardingRejected` | University |
| **Awarded** | *No actions visible* (Waiting for committee) | N/A | None |
| **SponsoringInProcess** | Sponsor, Reject | `Sponsored`, `SponsoringRejected` | Direct Aid Committee |
| **Sponsored** | Upload Award Letter, Register Student | `Registered` | University |
| **Registered** | Graduate Student | `Graduated` | University |
| **Graduated** | *No actions visible* (Workflow Completed) | N/A | None |
| **Any Rejected Status** | *Read Only* (No Actions) | N/A | None |

---

## Technical Rationale: Why This Design?

Using a single consolidated `ApplicationStatus` column instead of three separate status columns provides the following advantages:

1. **One ApplicationStatus Column:** A single field in the database represents the ground truth.
2. **No Duplicate Statuses:** Eliminates scenarios where a student could be marked as "Accepted" in Acceptance status but "Rejected" in Awarding status simultaneously.
3. **Simple Backend Logic:** API endpoints only need to perform a simple status check and execute state-to-state mutations.
4. **Simple Angular Implementation:** Angular components can bind to a single string property and use standard directives (`*ngIf` or `@if`) to render UI segments.
5. **Clear Role Separation:** States determine which role has edit permissions, ensuring University and Committee roles cannot overwrite each other's work.
6. **Easy Dashboard Filtering:** Allows dashboards to quickly filter student lists using simple query parameters.
7. **Easy Reporting:** Generating metrics (e.g., "Number of students currently awaiting Sponsoring") is straightforward and fast.
8. **Easy Permissions:** State access can be managed via middleware checking if the current user's role has permission to write in the current state.
9. **Easy Maintenance:** The state machine can be updated or expanded with minimal risk of database corruption.
10. **State-Level Clarity:** The current status always maps 1:1 to exactly where the application is in the lifecycle.

---

## Role Responsibilities

The following table summarizes the responsibilities assigned to each system actor:

| Role | Responsibility |
| :--- | :--- |
| **Student** | Submits the application, uploads mandatory documents, and monitors status updates. |
| **University** | Handles the **Acceptance** review, **Awarding** checks, final student **Registration**, and eventual **Graduation** processing. |
| **Direct Aid Committee** | Evaluates the financial viability and issues the **Sponsoring** decision (Sponsor/Reject). |
| **Marketing** | Possesses read-only access to view application progress and status reports (where applicable). |

---

## Future Extensibility Notes

> [!NOTE]
> If future business requirements dictate that **Acceptance**, **Awarding**, and **Sponsoring** must progress independently and concurrently, the database and backend can be refactored to support three separate status columns.
> 
> However, for the current Scholarship Management System (SMS) implementation, the single-column `ApplicationStatus` state machine is the chosen architecture. It accurately models the sequential student journey while keeping the software architecture simple, highly maintainable, and scalable.
