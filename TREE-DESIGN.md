# Tree List Design in Tailwind CSS

This document explains the approach used in this project to create a clean, well-aligned tree structure with vertical guide lines, chevrons, and proper indentation.

## The Key Insight

Instead of using **absolute positioning** for the vertical lines (which requires careful math to align with the caret), this approach uses **flex containers with repeated guide elements**. Each depth level gets its own guide column that stretches the full height of the row.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│ Row Container (flex, items-stretch)                                  │
│ ┌──────┬──────┬──────┬────────────────────────────────────────────┐ │
│ │Guide │Guide │Guide │ Content Area                                │ │
│ │ w-6  │ w-6  │ w-6  │ (chevron, icon, name, actions...)          │ │
│ │  │   │  │   │  │   │                                            │ │
│ │  │   │  │   │  │   │                                            │ │
│ └──│───┴──│───┴──│───┴────────────────────────────────────────────┘ │
│    │      │      │                                                   │
│    ▼      ▼      ▼                                                   │
│  depth   depth  depth                                                │
│    0      1      2                                                   │
└─────────────────────────────────────────────────────────────────────┘
```

## The TreeGuides Component

```tsx
function TreeGuides({ depth, isMobile }: { depth: number; isMobile?: boolean }) {
  const guideWidth = isMobile ? "w-4" : "w-6";
  return (
    <>
      {Array.from({ length: depth }).map((_, i) => (
        <div key={i} className={`${guideWidth} flex-shrink-0 flex justify-center`}>
          <div className="w-px h-full bg-line" />
        </div>
      ))}
    </>
  );
}
```

### How it works:

1. **For each depth level**, render a fixed-width column (`w-6` desktop, `w-4` mobile)
2. **Each column contains** a 1px wide div that fills the full height (`w-px h-full`)
3. **The line is centered** using `flex justify-center`
4. **`flex-shrink-0`** prevents the guides from compressing

### Why this works better than absolute positioning:

| Absolute Positioning | Flex Guides (this approach) |
|---------------------|----------------------------|
| Requires precise math: `left: 20 + depth * 14` | No math needed - automatic alignment |
| Line position breaks if padding changes | Responsive to layout changes |
| Need to manage `bottom-3` to stop line early | Lines naturally fill row height |
| Complex z-index management | No z-index issues |
| Hard to debug alignment | Visual structure matches DOM |

## Row Structure

Each row follows this structure:

```tsx
<div className="flex items-stretch pl-3 border-b border-line">
  {/* 1. Tree guides - one per depth level */}
  <TreeGuides depth={depth} />

  {/* 2. Content area - flex-1 to fill remaining space */}
  <div className="flex-1 flex items-center min-w-0 min-h-12 py-2">

    {/* 2a. Chevron slot - same width as guide for alignment */}
    <div className="w-6 flex-shrink-0 flex items-center justify-center">
      {hasChildren ? <ChevronIcon /> : <div className="w-4" />}
    </div>

    {/* 2b. Icon slot */}
    <div className="w-6 flex-shrink-0 flex items-center justify-center">
      <FolderIcon />
    </div>

    {/* 2c. Name - flex-1 with truncation */}
    <div className="flex-1 min-w-0 pr-4">
      <div className="truncate">{name}</div>
    </div>
  </div>

  {/* 3. Fixed-width data columns */}
  <div className="w-28 flex-shrink-0 flex items-center">Status</div>
  <div className="w-16 flex-shrink-0 flex items-center justify-end">R-value</div>
  <div className="w-24 flex-shrink-0 flex items-center justify-end">Bags</div>

  {/* 4. Actions */}
  <div className="w-24 flex-shrink-0 flex items-center justify-end pr-2">
    <ActionButtons />
  </div>
</div>
```

## Critical CSS Classes

### On the row container:
- `flex` - Enable flexbox
- `items-stretch` - **Critical!** Makes children fill the full height so guide lines extend properly
- `pl-3` - Left padding before the first guide

### On guide columns:
- `w-6` (or `w-4` mobile) - Fixed width matching chevron width
- `flex-shrink-0` - Prevent shrinking
- `flex justify-center` - Center the line within the column

### On the line itself:
- `w-px` - 1 pixel wide
- `h-full` - Fill container height (works because parent has `items-stretch`)
- `bg-line` - Your line color token

### On content area:
- `flex-1` - Fill remaining horizontal space
- `min-w-0` - Allow text truncation to work
- `min-h-12` - Minimum row height
- `py-2` - Vertical padding

## Alignment Magic

The key to perfect alignment: **the chevron slot width matches the guide width**.

```
Guide columns (depth=2)     Chevron    Icon     Name
├─────┼─────┤              ├────┤    ├────┤
  w-6   w-6                  w-6       w-6

      │     │                  ▼
      │     │                  ▼  (chevron center aligns with line center)
      │     └──────────────────┘
      │
      └─────── These lines pass through center of their w-6 columns
```

When you expand a folder, its children get `depth + 1` guides. The first N guides align with the parent's guides, and the extra guide aligns with where the parent's chevron was.

## Responsive Sizing

```tsx
// Desktop: wider spacing
const guideWidth = "w-6";  // 24px
const chevronSize = "w-4 h-4";
const rowHeight = "min-h-12";  // 48px for nested, min-h-14 for top-level

// Mobile: tighter spacing
const guideWidth = "w-4";  // 16px
const chevronSize = "w-3.5 h-3.5";
const rowHeight = "min-h-14";  // 56px for nested, min-h-16 for top-level
```

## Visual Hierarchy

### Top-level folders:
```tsx
const rowBg = isTopLevel ? "bg-surface" : "";
const fontWeight = isTopLevel ? "font-semibold text-base" : "font-medium";
const height = isTopLevel ? "min-h-14" : "min-h-12";
```

### Completed items:
```tsx
const textColor = isComplete ? "text-ink/70" : "text-ink";
```

### In-progress items:
```tsx
const rowBg = isInProgress ? "bg-progress/5" : "";
```

## Comparison with Your Approach

Your current approach:
```tsx
{/* Children container */}
<div className="relative ml-[18px] pl-5">
  {/* Vertical line */}
  <div className="absolute left-0 top-0 bottom-3 border-l border-border-color" />
  {/* children... */}
</div>
```

**Problems:**
1. `ml-[18px]` is a magic number that breaks if caret size changes
2. Absolute line requires manual positioning math
3. `bottom-3` is a hack to stop the line - what if row heights vary?
4. Children wrapper adds extra nesting

**This approach:**
```tsx
<div className="flex items-stretch pl-3 border-b">
  <TreeGuides depth={depth} />
  <div className="flex-1 flex items-center">
    <div className="w-6">{/* chevron */}</div>
    {/* content */}
  </div>
</div>
```

**Benefits:**
1. No magic numbers - `w-6` is a semantic width
2. No positioning math - flexbox handles it
3. Lines naturally fill row height
4. Flat structure - no extra wrappers

## Full Example

```tsx
function TreeRow({ item, depth }: { item: TreeItem; depth: number }) {
  const hasChildren = item.children.length > 0;
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      {/* This row */}
      <div className="flex items-stretch pl-3 border-b border-line hover:bg-surface/50">
        <TreeGuides depth={depth} />

        <div className="flex-1 flex items-center min-w-0 min-h-12 py-2">
          {/* Chevron - width matches guide width */}
          <div className="w-6 flex-shrink-0 flex items-center justify-center">
            {hasChildren ? (
              <button onClick={() => setIsExpanded(!isExpanded)}>
                <svg
                  className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                  viewBox="0 0 24 24"
                >
                  <path d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ) : (
              <div className="w-4" /> {/* Spacer */}
            )}
          </div>

          {/* Icon */}
          <div className="w-6 flex-shrink-0 flex items-center justify-center">
            <FolderIcon className="w-4 h-4 text-muted" />
          </div>

          {/* Name */}
          <div className="flex-1 min-w-0 pr-4">
            <div className="truncate font-medium">{item.name}</div>
          </div>
        </div>

        {/* Actions */}
        <div className="w-20 flex-shrink-0 flex items-center justify-end pr-2">
          <MenuButton />
        </div>
      </div>

      {/* Children - each gets depth + 1 */}
      {isExpanded && item.children.map(child => (
        <TreeRow key={child.id} item={child} depth={depth + 1} />
      ))}
    </>
  );
}

function TreeGuides({ depth }: { depth: number }) {
  return (
    <>
      {Array.from({ length: depth }).map((_, i) => (
        <div key={i} className="w-6 flex-shrink-0 flex justify-center">
          <div className="w-px h-full bg-gray-200" />
        </div>
      ))}
    </>
  );
}

// Usage
function Tree({ items }: { items: TreeItem[] }) {
  return (
    <div className="border border-line rounded-lg overflow-hidden">
      {items.map(item => (
        <TreeRow key={item.id} item={item} depth={0} />
      ))}
    </div>
  );
}
```

## Summary

1. **Use flex with `items-stretch`** so guide columns fill row height
2. **Render guide columns per depth level** - no absolute positioning
3. **Match chevron slot width to guide width** for automatic alignment
4. **Use `flex-shrink-0`** on fixed-width columns
5. **Use `min-w-0`** on content area to enable text truncation
6. **Keep row structure flat** - no extra wrappers for children

The result is a tree that "just works" regardless of content, row heights, or responsive breakpoints.
