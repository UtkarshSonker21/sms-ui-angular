# Development Context

* Do NOT create any new `.js` files for code generation, search-and-replace, or automation (e.g. `transform.js`, `add-phone.js`, `fix-dropdowns.js`, `flex-footer.js`, etc.).
* Do NOT create temporary helper scripts to edit Angular files.
* Do NOT create migration scripts or transformation scripts.
* Do NOT generate any files outside the requested Angular component.
* If a task belongs to a specific Angular component (e.g., the Student component), all implementation (logic, HTML, styling, TypeScript) must remain inside that component's files directly (`*.ts`, `*.html`, `*.scss`).
* Edit components directly as a developer would. Treat this as a strict project standard going forward.
