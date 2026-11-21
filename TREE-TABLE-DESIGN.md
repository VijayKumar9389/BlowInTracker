# Tree Table Design: Grid Layout + Data Aggregation

This document explains how to combine a tree structure with table-like columns, header rows for top-level items, and recursive data aggregation from children to parents.

## Use Case

You have a hierarchical structure (locations, warehouses, categories) and want to:
- Display it as an expandable tree
- Show data columns like a table (quantity, value, status)
- Aggregate child data onto parent rows (total items, total value)
- Style top-level items as "headers" that stand out

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ▼ Warehouse A              │ Status    │ Items  │ Value    │ Actions      │ ← Header row
├─────────────────────────────────────────────────────────────────────────────┤
│   │ ▼ Section 1            │ 2 of 3    │ 150    │ $12,500  │              │ ← Aggregated
│   │   │ □ Shelf A          │ Ready     │ 50     │ $4,000   │              │ ← Leaf item
│   │   │ □ Shelf B          │ Ready     │ 60     │ $5,000   │              │
│   │   │ □ Shelf C          │ Low       │ 40     │ $3,500   │              │
│   │ ► Section 2 (collapsed)│ 1 of 2    │ 80     │ $6,200   │              │
├─────────────────────────────────────────────────────────────────────────────┤
│ ▼ Warehouse B              │ Status    │ Items  │ Value    │ Actions      │ ← Header row
└─────────────────────────────────────────────────────────────────────────────┘
```

## 1. Grid-Like Column Layout

### The Pattern: Fixed-Width Columns with Flex

Instead of CSS Grid or `<table>`, use flex with fixed-width divs:

```tsx
<div className="flex items-stretch">
  {/* Tree structure (variable width) */}
  <TreeGuides depth={depth} />

  {/* Name column (flex-1 = fills remaining space) */}
  <div className="flex-1 min-w-0">...</div>

  {/* Fixed columns */}
  <div className="w-28 flex-shrink-0">Status</div>
  <div className="w-20 flex-shrink-0 text-right">Items</div>
  <div className="w-24 flex-shrink-0 text-right">Value</div>
  <div className="w-24 flex-shrink-0">Actions</div>
</div>
```

### Why Flex Over Grid/Table?

| Approach | Problem |
|----------|---------|
| `<table>` | Can't easily nest rows, complex DOM structure |
| CSS Grid | Nested grids don't align with parent grid |
| **Flex + fixed widths** | Simple, nestable, columns naturally align |

### Column Width Guidelines

```tsx
// Define your column widths consistently
const COLUMNS = {
  status: "w-28",    // 112px - for badges/chips
  quantity: "w-20",  // 80px - for numbers
  value: "w-24",     // 96px - for currency
  actions: "w-24",   // 96px - for buttons
};
```

### Full Row Structure

```tsx
function TreeRow({ item, depth, isTopLevel }: Props) {
  return (
    <div className={`
      flex items-stretch pl-3 border-b border-line
      ${isTopLevel ? "bg-surface" : ""}
    `}>
      {/* 1. Tree guides */}
      <TreeGuides depth={depth} />

      {/* 2. Content area with chevron + icon + name */}
      <div className="flex-1 flex items-center min-w-0 min-h-12 py-2">
        <div className="w-6 flex-shrink-0">{/* chevron */}</div>
        <div className="w-6 flex-shrink-0">{/* icon */}</div>
        <div className="flex-1 min-w-0 pr-4">
          <div className="truncate">{item.name}</div>
        </div>
      </div>

      {/* 3. Status column */}
      <div className="w-28 flex-shrink-0 flex items-center">
        <StatusBadge status={item.status} />
      </div>

      {/* 4. Items column */}
      <div className="w-20 flex-shrink-0 flex items-center justify-end">
        <span className="tabular-nums">{item.itemCount}</span>
      </div>

      {/* 5. Value column */}
      <div className="w-24 flex-shrink-0 flex items-center justify-end">
        <span className="tabular-nums">${item.value.toLocaleString()}</span>
      </div>

      {/* 6. Actions column */}
      <div className="w-24 flex-shrink-0 flex items-center justify-end pr-2">
        <ActionMenu />
      </div>
    </div>
  );
}
```

## 2. Header-Style Top-Level Rows

Top-level items should stand out as section headers:

```tsx
function TreeRow({ item, depth, isTopLevel, isFirst }: Props) {
  // Visual hierarchy
  const rowBg = isTopLevel ? "bg-surface" : "";
  const fontStyle = isTopLevel ? "font-semibold text-base" : "font-medium text-sm";
  const rowHeight = isTopLevel ? "min-h-14" : "min-h-12";

  // Border styling - top-level items get top border (except first)
  const borderStyle = isTopLevel
    ? (isFirst ? "" : "border-t border-line")
    : "border-b border-line";

  return (
    <div className={`flex items-stretch pl-3 ${borderStyle} ${rowBg}`}>
      <div className={`flex-1 flex items-center min-w-0 ${rowHeight} py-2`}>
        {/* ... */}
        <div className={`flex-1 min-w-0 ${fontStyle}`}>
          {item.name}
        </div>
      </div>
      {/* columns... */}
    </div>
  );
}
```

### Visual Differences

| Property | Top-Level (Header) | Nested (Content) |
|----------|-------------------|------------------|
| Background | `bg-surface` (light gray) | transparent |
| Font | `font-semibold text-base` | `font-medium text-sm` |
| Height | `min-h-14` (56px) | `min-h-12` (48px) |
| Border | `border-t` (top) | `border-b` (bottom) |
| Icon size | Same | Same |

## 3. Recursive Data Aggregation

The key feature: parent rows show aggregated data from all descendants.

### The Recursive Counter Function

```tsx
type AggregatedData = {
  totalItems: number;
  totalValue: number;
  childCount: number;
  readyCount: number;
  lowStockCount: number;
};

function aggregateData(location: LocationWithChildren): AggregatedData {
  // Start with this location's direct data
  let totalItems = location.items?.length ?? 0;
  let totalValue = location.items?.reduce((sum, item) => sum + item.value, 0) ?? 0;
  let childCount = location.items?.length ?? 0;
  let readyCount = location.items?.filter(i => i.status === "READY").length ?? 0;
  let lowStockCount = location.items?.filter(i => i.status === "LOW").length ?? 0;

  // Recursively add children's data
  for (const child of location.children) {
    const childData = aggregateData(child);
    totalItems += childData.totalItems;
    totalValue += childData.totalValue;
    childCount += childData.childCount;
    readyCount += childData.readyCount;
    lowStockCount += childData.lowStockCount;
  }

  return { totalItems, totalValue, childCount, readyCount, lowStockCount };
}
```

### Using Aggregated Data in Rows

```tsx
function LocationRow({ location, depth, isTopLevel }: Props) {
  const hasChildren = location.children.length > 0;
  const hasItems = location.items.length > 0;

  // Get aggregated data from all descendants
  const { totalItems, totalValue, childCount, readyCount } = aggregateData(location);

  const isEmpty = childCount === 0;
  const allReady = childCount > 0 && readyCount === childCount;
  const progressPercent = childCount > 0 ? (readyCount / childCount) * 100 : 0;

  return (
    <div className="flex items-stretch pl-3 border-b border-line">
      {/* Tree structure + name */}
      <TreeGuides depth={depth} />
      <div className="flex-1 flex items-center min-w-0 min-h-12 py-2">
        {/* chevron, icon, name... */}
      </div>

      {/* Status - shows aggregate progress */}
      <div className="w-28 flex-shrink-0 flex items-center">
        {isEmpty ? (
          <span className="text-xs text-muted">Empty</span>
        ) : (
          <div className="flex items-center gap-2">
            {/* Progress bar */}
            <div className="w-9 h-1 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            {/* Count */}
            <span className={`text-xs tabular-nums ${allReady ? "text-green-600" : "text-muted"}`}>
              {readyCount} of {childCount}
            </span>
          </div>
        )}
      </div>

      {/* Items count - aggregated */}
      <div className="w-20 flex-shrink-0 flex items-center justify-end">
        {totalItems > 0 && (
          <span className="text-sm tabular-nums font-semibold">{totalItems}</span>
        )}
      </div>

      {/* Value - aggregated */}
      <div className="w-24 flex-shrink-0 flex items-center justify-end">
        {totalValue > 0 && (
          <span className="text-sm tabular-nums">${totalValue.toLocaleString()}</span>
        )}
      </div>

      {/* Actions */}
      <div className="w-24 flex-shrink-0 flex items-center justify-end pr-2">
        <ActionMenu />
      </div>
    </div>
  );
}
```

## 4. Differentiating Parent vs Leaf Rows

Parents (folders/categories) show aggregated data. Leaves (actual items) show their own data.

```tsx
function TreeRow({ item, depth }: Props) {
  const isLeaf = item.children.length === 0 && !item.isContainer;

  if (isLeaf) {
    return <LeafRow item={item} depth={depth} />;
  }
  return <ContainerRow item={item} depth={depth} />;
}

// Leaf: shows direct item data
function LeafRow({ item, depth }: Props) {
  return (
    <div className="flex items-stretch pl-3 border-b border-line">
      <TreeGuides depth={depth} />
      <div className="flex-1 flex items-center min-w-0 min-h-12 py-2">
        <div className="w-6" /> {/* No chevron for leaf */}
        <div className="w-6"><ItemIcon /></div>
        <div className="flex-1 min-w-0">{item.name}</div>
      </div>

      {/* Direct values, not aggregated */}
      <div className="w-28"><StatusBadge status={item.status} /></div>
      <div className="w-20 text-right">{item.quantity}</div>
      <div className="w-24 text-right">${item.value}</div>
      <div className="w-24"><Actions /></div>
    </div>
  );
}

// Container: shows aggregated data
function ContainerRow({ item, depth }: Props) {
  const aggregated = aggregateData(item);

  return (
    <div className="flex items-stretch pl-3 border-b border-line">
      <TreeGuides depth={depth} />
      <div className="flex-1 flex items-center min-w-0 min-h-12 py-2">
        <div className="w-6"><ChevronIcon /></div>
        <div className="w-6"><FolderIcon /></div>
        <div className="flex-1 min-w-0 font-medium">{item.name}</div>
      </div>

      {/* Aggregated values */}
      <div className="w-28"><ProgressIndicator data={aggregated} /></div>
      <div className="w-20 text-right font-semibold">{aggregated.totalQuantity}</div>
      <div className="w-24 text-right">${aggregated.totalValue.toLocaleString()}</div>
      <div className="w-24"><Actions /></div>
    </div>
  );
}
```

## 5. Mobile Adaptation

On mobile, stack the data columns below the name instead of beside it:

```tsx
function TreeRow({ item, depth }: Props) {
  const aggregated = aggregateData(item);

  return (
    <>
      {/* Desktop: horizontal columns */}
      <div className="hidden md:flex items-stretch pl-3 border-b border-line">
        <TreeGuides depth={depth} />
        <div className="flex-1 flex items-center min-h-12 py-2">
          {/* name */}
        </div>
        <div className="w-28">{/* status */}</div>
        <div className="w-20">{/* items */}</div>
        <div className="w-24">{/* value */}</div>
        <div className="w-24">{/* actions */}</div>
      </div>

      {/* Mobile: stacked below name */}
      <div className="md:hidden flex items-stretch pl-3 border-b border-line">
        <TreeGuides depth={depth} isMobile />
        <div className="flex-1 min-w-0 py-3">
          {/* Name row */}
          <div className="flex items-center">
            <div className="w-4">{/* chevron */}</div>
            <div className="w-5">{/* icon */}</div>
            <div className="flex-1 min-w-0 truncate font-medium">{item.name}</div>
          </div>

          {/* Data row - below name */}
          <div className="text-xs text-muted mt-1 ml-9">
            {aggregated.readyCount} of {aggregated.childCount} ready
            <span className="mx-1.5">·</span>
            <span className="font-semibold text-ink">{aggregated.totalItems}</span> items
            <span className="mx-1.5">·</span>
            ${aggregated.totalValue.toLocaleString()}
          </div>
        </div>

        {/* Just actions on right */}
        <div className="flex-shrink-0 flex items-center pr-2">
          <ActionMenu />
        </div>
      </div>
    </>
  );
}
```

## 6. Full Working Example

```tsx
// Types
type Item = {
  id: string;
  name: string;
  quantity: number;
  value: number;
  status: "READY" | "LOW" | "OUT";
};

type Location = {
  id: string;
  name: string;
  items: Item[];
  children: Location[];
};

// Aggregation
function aggregateLocation(location: Location) {
  let totalQuantity = location.items.reduce((sum, i) => sum + i.quantity, 0);
  let totalValue = location.items.reduce((sum, i) => sum + i.value, 0);
  let itemCount = location.items.length;
  let readyCount = location.items.filter(i => i.status === "READY").length;

  for (const child of location.children) {
    const childAgg = aggregateLocation(child);
    totalQuantity += childAgg.totalQuantity;
    totalValue += childAgg.totalValue;
    itemCount += childAgg.itemCount;
    readyCount += childAgg.readyCount;
  }

  return { totalQuantity, totalValue, itemCount, readyCount };
}

// Tree guides
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

// Location row (container)
function LocationRow({ location, depth, isTopLevel, isFirst }: {
  location: Location;
  depth: number;
  isTopLevel: boolean;
  isFirst: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasContents = location.children.length > 0 || location.items.length > 0;
  const agg = aggregateLocation(location);

  const isEmpty = agg.itemCount === 0;
  const progressPercent = agg.itemCount > 0 ? (agg.readyCount / agg.itemCount) * 100 : 0;

  // Styling
  const rowBg = isTopLevel ? "bg-gray-50" : "";
  const fontStyle = isTopLevel ? "font-semibold" : "font-medium";
  const rowHeight = isTopLevel ? "min-h-14" : "min-h-12";
  const borderStyle = isTopLevel
    ? (isFirst ? "" : "border-t border-gray-200")
    : "border-b border-gray-200";

  return (
    <>
      <div
        className={`flex items-stretch pl-3 ${borderStyle} ${rowBg} hover:bg-gray-50/80 cursor-pointer`}
        onClick={() => hasContents && setIsExpanded(!isExpanded)}
      >
        <TreeGuides depth={depth} />

        <div className={`flex-1 flex items-center min-w-0 ${rowHeight} py-2`}>
          {/* Chevron */}
          <div className="w-6 flex-shrink-0 flex items-center justify-center">
            {hasContents ? (
              <svg className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? "rotate-90" : ""}`} viewBox="0 0 24 24">
                <path fill="none" stroke="currentColor" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            ) : <div className="w-4" />}
          </div>

          {/* Folder icon */}
          <div className="w-6 flex-shrink-0 flex items-center justify-center">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          </div>

          {/* Name */}
          <div className={`flex-1 min-w-0 pr-4 ${fontStyle}`}>
            <div className="truncate">{location.name}</div>
          </div>
        </div>

        {/* Status column */}
        <div className="w-28 flex-shrink-0 flex items-center">
          {isEmpty ? (
            <span className="text-xs text-gray-400">Empty</span>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-9 h-1 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{ width: `${progressPercent}%` }} />
              </div>
              <span className="text-xs tabular-nums text-gray-500">
                {agg.readyCount}/{agg.itemCount}
              </span>
            </div>
          )}
        </div>

        {/* Quantity column */}
        <div className="w-20 flex-shrink-0 flex items-center justify-end text-sm">
          {agg.totalQuantity > 0 && (
            <span className="tabular-nums font-semibold">{agg.totalQuantity}</span>
          )}
        </div>

        {/* Value column */}
        <div className="w-24 flex-shrink-0 flex items-center justify-end text-sm">
          {agg.totalValue > 0 && (
            <span className="tabular-nums">${agg.totalValue.toLocaleString()}</span>
          )}
        </div>

        {/* Actions */}
        <div className="w-24 flex-shrink-0 flex items-center justify-end pr-2">
          <button className="p-2 hover:bg-gray-100 rounded">•••</button>
        </div>
      </div>

      {/* Children */}
      {isExpanded && (
        <>
          {/* Items first */}
          {location.items.map(item => (
            <ItemRow key={item.id} item={item} depth={depth + 1} />
          ))}
          {/* Then sublocations */}
          {location.children.map(child => (
            <LocationRow
              key={child.id}
              location={child}
              depth={depth + 1}
              isTopLevel={false}
              isFirst={false}
            />
          ))}
        </>
      )}
    </>
  );
}

// Item row (leaf)
function ItemRow({ item, depth }: { item: Item; depth: number }) {
  const statusColors = {
    READY: "bg-green-100 text-green-700",
    LOW: "bg-amber-100 text-amber-700",
    OUT: "bg-red-100 text-red-700",
  };

  return (
    <div className="flex items-stretch pl-3 border-b border-gray-200 hover:bg-gray-50/50">
      <TreeGuides depth={depth} />

      <div className="flex-1 flex items-center min-w-0 min-h-12 py-2">
        {/* No chevron for leaf */}
        <div className="w-6 flex-shrink-0" />

        {/* Item icon */}
        <div className="w-6 flex-shrink-0 flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-gray-300" />
        </div>

        {/* Name */}
        <div className="flex-1 min-w-0 pr-4">
          <div className="truncate text-sm">{item.name}</div>
        </div>
      </div>

      {/* Status */}
      <div className="w-28 flex-shrink-0 flex items-center">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[item.status]}`}>
          {item.status}
        </span>
      </div>

      {/* Quantity */}
      <div className="w-20 flex-shrink-0 flex items-center justify-end text-sm">
        <span className="tabular-nums">{item.quantity}</span>
      </div>

      {/* Value */}
      <div className="w-24 flex-shrink-0 flex items-center justify-end text-sm">
        <span className="tabular-nums">${item.value.toLocaleString()}</span>
      </div>

      {/* Actions */}
      <div className="w-24 flex-shrink-0 flex items-center justify-end pr-2">
        <button className="p-2 hover:bg-gray-100 rounded">•••</button>
      </div>
    </div>
  );
}

// Main tree component
function InventoryTree({ locations }: { locations: Location[] }) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {locations.map((location, index) => (
        <LocationRow
          key={location.id}
          location={location}
          depth={0}
          isTopLevel={true}
          isFirst={index === 0}
        />
      ))}
    </div>
  );
}
```

## Summary

1. **Grid layout**: Use flex with fixed-width columns (`w-28`, `w-20`, etc.) - they align naturally across all rows
2. **Header rows**: Top-level items get `bg-surface`, `font-semibold`, `border-t`, taller height
3. **Data aggregation**: Recursive function that sums child data, called at render time
4. **Parent vs leaf**: Containers show aggregated data + progress, leaves show direct values
5. **Mobile**: Stack data below name instead of horizontal columns

The key insight: **every row has the same column structure**, whether it's a top-level header, nested container, or leaf item. The columns always align because they're all the same width.
