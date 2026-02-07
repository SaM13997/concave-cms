# **Design Document: Concave CMS**

## **1\. Vision Statement**

**Concave** is a convex-native, headless CMS designed to bridge the gap between high-velocity engineering and non-technical content management. Unlike traditional headless CMSs that feel like external appendages, Concave acts as a "visual indentation" into the Convex backend. It provides a seamless, real-time interface for data management where the **schema is the source of truth**, whether written in TypeScript or built via a UI.

## **2\. Core Philosophy: "The Convex-Native Edge"**

- **Zero-Sync Architecture:** The CMS does not "sync" with a database; it _is_ the interface for the database.
- **Reactive by Default:** Content updates are reflected across all consuming applications instantly via Convex subscriptions.
- **Bilingual Schema:** The system treats a developer’s schema.ts and a marketer’s visual builder as two views of the same logic.

---

## **3\. Key Functional Pillars**

### **A. The Visual Schema Engine (Marketer Mode)**

The "What": A drag-and-drop interface for non-technical users to define the structure of their content.

- **Visual-to-Type Mapping:** Marketers can add tables, define relationships, and choose field types (Rich Text, Image, Reference, etc.) without touching a code editor.
- **Structural Guardrails:** The engine ensures that visually created schemas remain compliant with Convex’s strict typing system.
- **Seamless Handover:** Changes made in Marketer Mode generate the corresponding configuration that developers can eventually "lock" into code if needed.

### **B. Content Lifecycle & Draft Mode**

The "What": A sophisticated versioning system that prevents unfinished content from leaking into production.

- **Shadow Drafting:** Every document maintains a "Draft" state and a "Published" state within the same collection, utilizing Convex’s transactional atomicity.
- **Preview Environments:** One-click generated URLs that allow marketers to see how a draft looks on the live frontend before hitting "Publish."
- **Time Travel:** A qualitative history of changes, allowing users to compare versions and revert to previous states of a content entry.

### **C. The Admin Experience (TanStack Start \+ Shadcn)**

The "What": A high-performance, accessible management dashboard.

- **Fluid Navigation:** Leveraging TanStack Start’s router for near-instant transitions between content types and entries.
- **Command Center:** A global search (Cmd+K) to find any piece of content, schema definition, or media asset instantly.
- **Contextual Feedback:** Real-time presence indicators (who else is editing this post?) and toast notifications for successful deployments.

### **D. Governance & Security (Better Auth)**

The "What": A robust identity layer that determines who can see, edit, or break things.

- **Role-Based Access (RBAC):** Defining clear boundaries (e.g., "Editor" can change content, but only "Admin" can change Schema).
- **Session Management:** Secure, modern authentication that integrates deeply with the TanStack Start middleware and Convex server-side functions.

---

## **4\. User Personas**

| Persona           | The "Win"                                                                                                            |
| :---------------- | :------------------------------------------------------------------------------------------------------------------- |
| **The Developer** | Defines complex data logic once. Never has to manually update a CMS UI or deal with "stale" content API calls.       |
| **The Marketer**  | Gains total autonomy over landing pages and blog structures without waiting for a sprint cycle to "add a new field." |
| **The End User**  | Experiences a lightning-fast site where content updates feel live, not cached.                                       |

---

## **5\. Success Metrics**

- **Schema Parity:** 100% agreement between the visual UI and the backend database constraints.
- **Publish Latency:** Under 200ms from clicking "Publish" to the content appearing on the frontend via Convex subscriptions.
- **Onboarding Speed:** A non-technical user can create a "Blog" content type and publish their first post in under 2 minutes.
