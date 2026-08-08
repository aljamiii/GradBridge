# GradBridge — Frontend Design System

Everything the UI is built from. Read this before adding a page or a component;
the whole point is that no page invents its own spacing, colour or shadow.

---

## 1. Where things live

| Path | What it is |
|---|---|
| `client/src/index.css` | Design tokens (`@theme`), base styles, utility classes |
| `client/src/components/ui.jsx` | Every shared primitive (Card, Button, PageHeader…) |
| `client/src/components/Icon.jsx` | The icon set — hand-written SVG paths, no dependency |
| `client/src/components/AppShell.jsx` | Signed-in layout: sidebar + topbar |
| `client/src/components/MarketingNav.jsx` | Public site header (landing page only) |
| `client/src/components/AuthLayout.jsx` | Split-screen shell for login/register |
| `client/src/App.jsx` | Route table — decides which layout wraps which route |

---

## 2. Tokens

Defined once in `index.css` under `@theme`, consumed as Tailwind classes.

### Colour

- **`brand-50 … brand-900`** — indigo. The primary action colour. `brand-600`
  is the default button/link; `brand-50` is the tint for active nav and hover.
- **`ink-900 / ink-700 / ink-500 / ink-400`** — text, darkest to lightest.
  `ink-900` headings · `ink-700` body · `ink-500` secondary · `ink-400` meta.
- **Semantic** — `emerald` success, `amber` warning, `red` danger, `sky` live/presence.

> Never write `indigo-*` or `slate-800` for text again. Use `brand-*` and `ink-*`
> so a future theme change is a one-file edit.

### Elevation

Four layered shadows, applied as `shadow-[var(--shadow-card)]`:

| Token | Use |
|---|---|
| `--shadow-card` | Resting cards |
| `--shadow-card-hover` | Cards under the cursor (via `.lift`) |
| `--shadow-float` | Dropdowns, popovers, modals, the hero mockup |
| `--shadow-brand` | Primary buttons (a coloured glow, not a grey one) |

### Type

**Plus Jakarta Sans** throughout (loaded in `index.html`). Headings get
`-0.02em` tracking automatically via the base layer — don't re-declare it.

| Role | Classes |
|---|---|
| Page title | `text-2xl font-bold tracking-tight sm:text-[1.75rem]` (or `<PageHeader>`) |
| Section heading | `text-3xl font-bold tracking-tight` |
| Card label | `text-xs font-semibold uppercase tracking-[0.08em] text-ink-400` |
| Body | `text-sm leading-relaxed text-ink-500` |
| Meta | `text-xs text-ink-400` |

### Utilities

| Class | Effect |
|---|---|
| `.bg-app` | The app background — soft indigo/sky radial wash, not flat grey |
| `.glass` | Frosted translucent surface (sticky headers) |
| `.text-gradient` | Brand gradient headline text |
| `.lift` | Hover: rise 2px + deepen shadow |
| `.animate-rise` | Entrance: fade + 10px rise |
| `.skeleton` | Shimmering loading placeholder |

All motion is disabled automatically under `prefers-reduced-motion`.

---

## 3. Primitives (`ui.jsx`)

```jsx
import { Page, PageHeader, Card, Button, Badge, Field, Input } from "../components/ui";
```

| Component | Notes |
|---|---|
| `<Page width="5xl">` | Page shell: centring, max width, responsive padding |
| `<PageHeader eyebrow title description actions />` | The standard masthead |
| `<Card hover padded>` | Content surface. `hover` only if the whole card is clickable |
| `<CardTitle right={…}>` | Uppercase label inside a card |
| `<Button variant size to href loading>` | `primary · secondary · ghost · danger · subtle`; renders `<Link>` when `to` is set |
| `<Badge tone>` | `brand · green · amber · red · slate · sky` |
| `<Field label hint error>` + `<Input> <Select> <Textarea>` | Forms |
| `<Alert tone>` | `info · success · warning · error` |
| `<EmptyState icon title description action />` | Say what's missing **and** what to do |
| `<Skeleton>` / `<Spinner>` | Loading states |
| `<Stat icon label value hint tone />` | Dashboard number tile |
| `<Avatar name size online />` | Initial avatar with optional presence dot |

---

## 4. Icons

```jsx
import Icon from "../components/Icon";
<Icon name="compass" className="h-5 w-5" />
```

Roughly 35 icons on a 24×24 grid, 1.7 stroke, round caps. `ICON_NAMES` exports
the full list.

**Rule: no emoji in chrome** — navigation, buttons, stat tiles and page titles
use `<Icon>`. Emoji are fine as *content* (map category labels, chat messages,
a system message like “📅 Booking request”).

To add one: append a path to `PATHS` in `Icon.jsx`, drawn on the same 24×24 grid.

---

## 5. Layouts

Three, chosen by route in `App.jsx`:

1. **`MarketingLayout`** — `/` only. `MarketingNav` + page, dark footer inside the page.
2. **Auth (bare)** — `/login`, `/register`. Full-bleed; `AuthLayout` splits form / brand panel.
3. **`AppLayout`** — everything behind auth. `AppShell` renders a fixed 256px
   sidebar (grouped nav, active accent bar, account block) plus a sticky topbar.
   Below `lg` the sidebar becomes a drawer with a scrim.

Sidebar navigation is data, not markup — edit the `NAV` object in `AppShell.jsx`.

---

## 6. Adding a new page (the whole recipe)

```jsx
import { Page, PageHeader, Card, Button } from "../components/ui";
import Icon from "../components/Icon";

export default function MyFeature() {
  return (
    <Page width="5xl">
      <PageHeader
        eyebrow="Module 3"
        title="My Feature"
        description="One sentence on what this answers for the student."
        actions={<Button variant="secondary">Secondary action</Button>}
      />
      <Card className="mt-8">…</Card>
    </Page>
  );
}
```

Then: add the route in `App.jsx` (inside `AppLayout`, wrapped in `guarded(...)`)
and an entry in the `NAV` group in `AppShell.jsx`.

---

## 7. Conventions worth keeping

- **Empty states are honest.** Say what's missing and the one action that fixes
  it — never a bare “No data”.
- **Enrichment fails soft.** A secondary fetch that fails must never blank the
  page (see the Survival Guide's nearby-students call).
- **Loading**: skeletons for lists, spinners for buttons.
- **Focus**: never remove the ring. It's defined once globally for `:focus-visible`.
- **Mobile first at 375px.** The navbar used to overflow there; the drawer fixed
  it. Re-check any new nav or two-column layout at that width.
- **Colour never carries meaning alone** — pair it with text or an icon
  (the map's fit overlay shows the score *and* the colour).

---

## 8. Known gaps / next steps

- Feature pages use the tokens and primitives but several still have bespoke
  internal layouts. Rebuilding **Universities**, **Forum** and **Chat** around
  `Card`/`EmptyState` would be the highest-value next pass.
- No dark mode. Tokens are structured to make it possible (swap the `@theme`
  values under a `.dark` selector) but no work has been done.
- Icons are hand-drawn; a couple (`settings`, `puzzle`) are geometrically
  simpler than the rest and could be redrawn.
