# AGENTS.md — Codebase conventions for Concave CMS

This document encodes the high-level architecture, file placement rules, and code style that make this codebase readable to a human. Follow these when adding features.

---

## Mental model

Concave CMS has three layers, each with its own directory:

| Layer | Directory | Responsibility |
|-------|-----------|----------------|
| **Frontend** | `src/` | React components, routes, client-side libs, styles |
| **Backend** | `convex/` | Serverless functions, schema, auth, DB queries |
| **Docs** | `docs/` | ADRs, design docs, launch plans |

The source of truth for domain concepts lives in `CONTEXT.md`. Read it before building anything domain-specific.

---

## File placement rules (the "where does this go?" guide)

### `src/components/`

```
components/
  ui/           shadcn/ui primitives (button, dialog, dropdown-menu, etc.)
  <feature>/    feature-specific components grouped together (e.g. auth/, schemas/, entries/, media/)
  <Component>.tsx   standalone singleton components with no siblings (e.g. BottomNav, UserButton)
```

**Rule:** If a feature needs **2+ files** related to it, create a folder. If it's one file, keep it flat.

**Examples:**
- `components/ui/button.tsx` — shadcn primitive
- `components/auth/SignInForm.tsx` — feature with potential siblings (SignUpForm, ResetPasswordForm...)
- `components/BottomNav.tsx` — singleton, no siblings needed

### `src/lib/`

```
lib/
  utils.ts          pure utility functions (cn(), getErrorMessage(), etc.)
  env.ts            client env var validation
  auth-client.ts    auth client singleton (Better Auth)
  convex/           Convex-specific hooks and API re-exports
```

**Rule:** `lib/` files must NOT import React. They are pure utilities, config, or data layer clients.

### `src/routes/`

Follows TanStack Router file-based routing. Route files are thin — they compose data fetching with a component, not both.

```
routes/
  __root.tsx      root layout (HTML shell, providers, navigation)
  index.tsx       home page
  sign-in.tsx     sign-in page
```

**Rule:** Route files call data functions and pass results to components. They don't contain complex data-fetching logic or multi-hundred-line components.

### `convex/`

```
convex/
  schema.ts          table definitions (defineSchema + defineTable)
  auth.ts            auth configuration
  http.ts            HTTP route handlers
  lib/               server-side utilities (env, email, helpers)
  <domain>.ts        domain-specific queries/mutations/actions
  convex.config.ts   Convex app definition & plugin registration
  _generated/        AUTO-GENERATED — never edit
```

**Rule:** Each domain (schemas, entries, media, auditLog) gets its own file in `convex/`. Don't cram all queries into one file. Split by domain concept.

**Example:** `convex/schemas.ts` for all schema CRUD, `convex/entries.ts` for entry CRUD, `convex/media.ts` for media operations.

---

## Component design rules

### When to split a component into its own file

1. **It has internal state or hooks** that would bloat the parent
2. **It's reused across multiple routes**
3. **It has responsive variants** — desktop and mobile versions go in separate files
4. **It's a distinct UI primitive** — one file per shadcn component

### Responsive splitting pattern

Instead of one component full of `useMediaQuery()` conditionals:

```
SchemasListDesktop.tsx   ✅  focused, small, readable
SchemasListMobile.tsx    ✅  focused, small, readable
```

The parent switches with CSS:
```tsx
<div className="sm:hidden"><SchemasListMobile items={items} /></div>
<div className="hidden sm:flex"><SchemasListDesktop items={items} /></div>
```

### File size target

Keep most files under **150 lines**. If a file grows beyond that, extract a sub-component or hook. Exceptions: shadcn primitive wrappers (boilerplate from CLI) and complex form components.

---

## Import conventions

### No barrel exports

**Never** create `index.ts` files that re-export from sibling files. Every import is a direct path to the source file.

```ts
// ✅ DO — explicit path to the file
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { SignInForm } from "@/components/auth/SignInForm"

// ❌ DON'T — barrel re-exports hide what's being imported
import { Button, Input } from "@/components/ui"  // non-obvious where these come from
```

### Path alias

- `@/` maps to `src/` — use it for all imports from `src/`
- Convex-side: relative imports within `convex/`, `convex/_generated/*` for generated API

### Import order

React imports first, then external libraries, then `@/` aliases, then relative imports. Biome's `organizeImports: on` handles this automatically.

---

## Naming conventions

| What | Convention | Examples |
|------|-----------|----------|
| React components (feature) | `PascalCase.tsx` | `SignInForm.tsx`, `BottomNav.tsx`, `SchemasListDesktop.tsx` |
| React components (shadcn/ui) | `kebab-case.tsx` | `button.tsx`, `dropdown-menu.tsx`, `dialog.tsx` |
| Route files | `kebab-case.tsx` | `sign-in.tsx`, `__root.tsx`, `content-types.tsx` |
| Utility/config files | `kebab-case.ts` | `auth-client.ts`, `env.ts`, `utils.ts` |
| Convex domain files | `camelCase.ts` | `schemas.ts`, `entries.ts`, `auditLog.ts` |
| TypeScript types | `PascalCase` | `SchemaDescriptor`, `Entry`, `Field` |
| Database tables | `camelCase` | `schemas`, `entries`, `auditLog`, `media` |
| CSS classes | Tailwind utility classes | No custom CSS unless unavoidable |

---

## Export conventions

- **Named exports only** for components and utilities. No `export default`.  
  Exception: files required by framework conventions (Convex HTTP routes, config files).

```ts
// ✅ DO
export function Button(props: ButtonProps) { ... }
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))

// ❌ DON'T
export default function Button(props: ButtonProps) { ... }
```

---

## Data fetching patterns

### Frontend (TanStack Query + Convex React Query)

- Use the Convex React Query hooks from `@convex-dev/react-query`
- Re-export convenience hooks from `src/lib/convex/hooks.ts`
- Route files use `useSuspenseQuery` for data that must resolve before render, `useQuery` for optional data

### Backend (Convex functions)

- **Queries** (`query`) — read-only, cached, reactive. Used for fetching data.
- **Mutations** (`mutation`) — write operations. Used for creates, updates, deletes.
- **Actions** (`action`) — side effects. Used for external API calls, email, file processing.

Each domain file exports its functions:

```ts
// convex/schemas.ts
export const listSchemas = query({ ... })
export const getSchema = query({ ... })
export const createSchema = mutation({ ... })
export const applySchema = mutation({ ... })
```

### Parallel fetching

When a page needs multiple independent queries, fetch them in parallel and degrade gracefully if one fails:

```ts
const results = await Promise.allSettled([fetchA(), fetchB(), fetchC()])
const [dataA, dataB, dataC] = results.map((r) =>
  r.status === "fulfilled" ? r.value : null
)
```

---

## Validation

- **Client-side env vars**: Zod schema in `src/lib/env.ts`
- **Server-side env vars**: `requireEnv()` helper in `convex/lib/env.ts`
- **Domain validation**: Zod schemas generated from active Schema Descriptors at runtime (ADR-003)
- **Route params**: use `invariant()` from `tiny-invariant` for required params

---

## Styling

- Tailwind CSS v4 with `@tailwindcss/vite` plugin
- Use `cn()` from `@/lib/utils` for merging conditional classes
- CSS custom properties for theming (light/dark) in `src/styles.css`
- shadcn/ui components use `data-slot` attributes for targeting

---

## Linting & formatting

**Biome** handles everything — no ESLint, no Prettier.

- Format: 2-space indent, 100 char line width, double quotes, trailing commas
- Organize imports on save
- Generated files excluded: `convex/_generated/**`, `src/routeTree.gen.ts`

Run before committing:
```bash
bun biome check --write
```

---

## Key anti-patterns to avoid

1. **Barrel exports** — no `index.ts` re-export files. Direct imports always.
2. **Inline data fetching** — don't put complex queries in route components. Extract to dedicated files.
3. **Mega-components** — no 300+ line components. Split by responsibility or device variant.
4. **Mixed concerns in `lib/`** — no React imports in `src/lib/`. Keep it pure.
5. **Untyped Convex functions** — always use the generated types from `convex/_generated/api`.
6. **Comment clutter** — don't add comments explaining what code does. The code should be self-documenting. Comments only for "why" when non-obvious.
