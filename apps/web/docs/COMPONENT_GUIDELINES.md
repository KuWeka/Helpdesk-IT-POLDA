# Component Usage Guidelines

## Page Headers

### Standardized Pattern: Use SectionHeader everywhere

All pages should use `<SectionHeader>` component instead of raw `<h1>` or `<Card>` headers.

**Correct Usage:**

```jsx
import SectionHeader from '@/components/SectionHeader.jsx';

export default function MyPage() {
  return (
    <div>
      <SectionHeader
        title="Page Title"
        subtitle="Optional subtitle or context"
        actions={<Button>Action</Button>}
      />
      {/* Page content */}
    </div>
  );
}
```

**Do NOT use:**
- Raw `<h1>` tags in page files
- `<Card><CardHeader><CardTitle>` as page-level header
- Inline header styles for page title blocks

## Empty States

### Standardized Pattern: Use Empty with variants

Use the `Empty` component from `src/components/ui/empty.jsx` with `EMPTY_STATE_VARIANTS`.

**Correct Usage:**

```jsx
import { Empty, EMPTY_STATE_VARIANTS } from '@/components/ui/empty.jsx';

{items.length === 0 ? (
  <Empty
    variant={EMPTY_STATE_VARIANTS.NO_RESULTS}
    title="Tidak ada data"
    description="Coba sesuaikan filter pencarian Anda."
    action={<Button>Refresh</Button>}
  />
) : (
  // content
)}
```

**Do NOT use:**
- Hardcoded empty-state `<div>` with manual icon/text
- Inconsistent text-only placeholders
- Different empty-state styles for similar contexts
