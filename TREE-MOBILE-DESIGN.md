# Tree Mobile Design: Perfect Indents & Lines on Small Screens

This document focuses specifically on making tree indentation and guide lines work perfectly on mobile devices.

## The Core Problem

Desktop tree spacing feels cramped on mobile. If you use `w-6` (24px) guides on a 375px screen with 4 depth levels, you've already used 96px just for indentation—25% of the screen width before any content.

**Solution**: Use narrower guides on mobile, but maintain the same alignment principles.

## 1. Responsive Guide Widths

### The Pattern: Conditional Width via Prop

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

### Width Comparison

| Breakpoint | Guide Width | Chevron Width | 4-Level Indent |
|------------|-------------|---------------|----------------|
| Desktop (≥768px) | `w-6` (24px) | `w-6` (24px) | 96px |
| Mobile (<768px) | `w-4` (16px) | `w-4` (16px) | 64px |

**Savings**: 32px more content space on mobile at max depth.

## 2. Dual Row Pattern

Render two separate row structures—one for desktop, one for mobile:

```tsx
function TreeRow({ item, depth }: Props) {
  return (
    <>
      {/* Desktop row - hidden on mobile */}
      <div className="hidden md:flex items-stretch pl-3 border-b border-line">
        <TreeGuides depth={depth} />
        {/* Desktop layout... */}
      </div>

      {/* Mobile row - hidden on desktop */}
      <div className="md:hidden flex items-stretch pl-3 border-b border-line">
        <TreeGuides depth={depth} isMobile />
        {/* Mobile layout... */}
      </div>
    </>
  );
}
```

### Why Two Rows Instead of Responsive Classes?

The layouts are fundamentally different:
- Desktop: Horizontal columns (name | status | qty | value | actions)
- Mobile: Stacked (name + data below, actions on right)

Trying to do this with responsive utilities creates unmaintainable class soup.

## 3. Matching Chevron to Guide Width

**Critical**: The chevron container must match the guide width exactly, or lines won't align with expanded children.

```tsx
// Desktop
<TreeGuides depth={depth} />  {/* Each guide is w-6 */}
<div className="w-6 flex-shrink-0 flex items-center justify-center">
  <svg className="w-4 h-4">...</svg>  {/* Icon inside is smaller */}
</div>

// Mobile
<TreeGuides depth={depth} isMobile />  {/* Each guide is w-4 */}
<div className="w-4 flex-shrink-0 flex items-center justify-center">
  <svg className="w-3.5 h-3.5">...</svg>  {/* Smaller icon */}
</div>
```

### Visual Alignment

```
Desktop (w-6 guides):
│     │     │     ▼ Folder Name
│     │     │     │
│     │     │     └─► Child (chevron aligns with parent's guide)

Mobile (w-4 guides):
│   │   │   ▼ Folder
│   │   │   │
│   │   │   └─► Child (still aligned, just tighter)
```

## 4. Complete Mobile Row Structure

```tsx
{/* Mobile row */}
<div className="md:hidden flex items-stretch pl-3 border-b border-line">
  {/* 1. Tree guides - w-4 each */}
  <TreeGuides depth={depth} isMobile />

  {/* 2. Content area */}
  <div className="flex-1 min-w-0 flex items-center min-h-14 py-3">
    {/* 2a. Chevron - w-4 to match guides */}
    <div className="w-4 flex-shrink-0 flex items-center justify-center">
      {hasChildren ? (
        <svg className="w-3.5 h-3.5 text-muted">...</svg>
      ) : (
        <div className="w-3.5" />
      )}
    </div>

    {/* 2b. Icon - w-5 (slightly wider for touch) */}
    <div className="w-5 flex-shrink-0 flex items-center justify-center">
      <FolderIcon className="w-4 h-4" />
    </div>

    {/* 2c. Name + stacked data */}
    <div className="flex-1 min-w-0 pr-2">
      <div className="truncate font-medium">{item.name}</div>
      <div className="text-xs text-muted mt-0.5">
        {/* Data stacked below name on mobile */}
        3 of 5 done · <span className="font-semibold text-ink">42</span> bags
      </div>
    </div>
  </div>

  {/* 3. Actions - no data columns on mobile */}
  <div className="flex-shrink-0 flex items-center pr-2">
    <ActionMenu />
  </div>
</div>
```

## 5. Touch Target Considerations

### Minimum Heights

```tsx
// Desktop: can be tighter
const desktopHeight = isTopLevel ? "min-h-14" : "min-h-12";  // 56px / 48px

// Mobile: needs larger touch targets
const mobileHeight = isTopLevel ? "min-h-16" : "min-h-14";   // 64px / 56px
```

### Row Padding

```tsx
// Desktop: minimal vertical padding
<div className="min-h-12 py-2">

// Mobile: more breathing room
<div className="min-h-14 py-3">
```

### Action Buttons

```tsx
// Desktop: can be smaller
<button className="w-8 h-8 flex items-center justify-center">

// Mobile: 44px minimum touch target
<button className="min-w-11 min-h-11 flex items-center justify-center">
```

## 6. Left Padding Strategy

The container needs left padding to give the first guide some breathing room from the edge:

```tsx
<div className="flex items-stretch pl-3 border-b">
  {/*                      ^^^ 12px left padding */}
  <TreeGuides depth={depth} isMobile />
  ...
</div>
```

**Why `pl-3` (12px)?**
- Enough to not feel cramped against the edge
- Not so much that it wastes space
- Same on desktop and mobile (no need to adjust)

## 7. Responsive Icon Sizing

```tsx
// Desktop icons
<svg className="w-4 h-4">  // 16px - standard

// Mobile icons - slightly smaller to fit tighter spacing
<svg className="w-3.5 h-3.5">  // 14px

// Or keep same size but in smaller container
<div className="w-4 flex items-center justify-center">  // container
  <svg className="w-4 h-4">  // icon fills it
</div>
```

## 8. The Full Responsive Component

```tsx
function TreeGuides({ depth, isMobile }: { depth: number; isMobile?: boolean }) {
  const guideWidth = isMobile ? "w-4" : "w-6";
  return (
    <>
      {Array.from({ length: depth }).map((_, i) => (
        <div key={i} className={`${guideWidth} flex-shrink-0 flex justify-center`}>
          <div className="w-px h-full bg-gray-200" />
        </div>
      ))}
    </>
  );
}

function FolderRow({ folder, depth, isTopLevel }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChildren = folder.children.length > 0;

  // Heights
  const desktopHeight = isTopLevel ? "min-h-14" : "min-h-12";
  const mobileHeight = isTopLevel ? "min-h-16" : "min-h-14";

  // Styling
  const rowBg = isTopLevel ? "bg-gray-50" : "";
  const fontStyle = isTopLevel ? "font-semibold" : "font-medium";

  return (
    <>
      {/* ============ DESKTOP ROW ============ */}
      <div
        className={`hidden md:flex items-stretch pl-3 border-b border-gray-200 ${rowBg} cursor-pointer`}
        onClick={() => hasChildren && setIsExpanded(!isExpanded)}
      >
        {/* Guides: w-6 each */}
        <TreeGuides depth={depth} />

        <div className={`flex-1 flex items-center min-w-0 ${desktopHeight} py-2`}>
          {/* Chevron: w-6 to match guides */}
          <div className="w-6 flex-shrink-0 flex items-center justify-center">
            {hasChildren ? (
              <svg
                className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                viewBox="0 0 24 24"
              >
                <path fill="none" stroke="currentColor" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            ) : (
              <div className="w-4" />
            )}
          </div>

          {/* Icon: w-6 */}
          <div className="w-6 flex-shrink-0 flex items-center justify-center">
            <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24">
              <path fill="none" stroke="currentColor" strokeWidth={1.5}
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          </div>

          {/* Name */}
          <div className={`flex-1 min-w-0 pr-4 ${fontStyle}`}>
            <div className="truncate">{folder.name}</div>
          </div>
        </div>

        {/* Desktop columns */}
        <div className="w-28 flex-shrink-0 flex items-center">
          <span className="text-sm text-gray-500">3 of 5</span>
        </div>
        <div className="w-20 flex-shrink-0 flex items-center justify-end">
          <span className="text-sm font-semibold">42</span>
        </div>
        <div className="w-24 flex-shrink-0 flex items-center justify-end pr-2">
          <button className="w-8 h-8">•••</button>
        </div>
      </div>

      {/* ============ MOBILE ROW ============ */}
      <div
        className={`md:hidden flex items-stretch pl-3 border-b border-gray-200 ${rowBg} cursor-pointer`}
        onClick={() => hasChildren && setIsExpanded(!isExpanded)}
      >
        {/* Guides: w-4 each (tighter) */}
        <TreeGuides depth={depth} isMobile />

        <div className={`flex-1 min-w-0 flex items-center ${mobileHeight} py-3`}>
          {/* Chevron: w-4 to match guides */}
          <div className="w-4 flex-shrink-0 flex items-center justify-center">
            {hasChildren ? (
              <svg
                className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                viewBox="0 0 24 24"
              >
                <path fill="none" stroke="currentColor" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            ) : (
              <div className="w-3.5" />
            )}
          </div>

          {/* Icon: w-5 */}
          <div className="w-5 flex-shrink-0 flex items-center justify-center">
            <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24">
              <path fill="none" stroke="currentColor" strokeWidth={1.5}
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          </div>

          {/* Name + stacked data */}
          <div className="flex-1 min-w-0 pr-2">
            <div className={`truncate ${fontStyle}`}>{folder.name}</div>
            <div className="text-xs text-gray-500 mt-0.5">
              3 of 5 done · <span className="font-semibold text-gray-900">42</span> bags
            </div>
          </div>
        </div>

        {/* Just actions on mobile */}
        <div className="flex-shrink-0 flex items-center pr-2">
          <button className="min-w-11 min-h-11 flex items-center justify-center">•••</button>
        </div>
      </div>

      {/* ============ CHILDREN ============ */}
      {isExpanded && folder.children.map(child => (
        <FolderRow
          key={child.id}
          folder={child}
          depth={depth + 1}
          isTopLevel={false}
        />
      ))}
    </>
  );
}
```

## 9. Width Reference Table

| Element | Desktop | Mobile | Notes |
|---------|---------|--------|-------|
| Guide column | `w-6` (24px) | `w-4` (16px) | Each depth level |
| Chevron container | `w-6` (24px) | `w-4` (16px) | Must match guide |
| Chevron icon | `w-4 h-4` | `w-3.5 h-3.5` | Smaller on mobile |
| Folder icon container | `w-6` (24px) | `w-5` (20px) | Slightly wider for touch |
| Row min-height (top) | `min-h-14` (56px) | `min-h-16` (64px) | Touch targets |
| Row min-height (nested) | `min-h-12` (48px) | `min-h-14` (56px) | Touch targets |
| Row padding vertical | `py-2` | `py-3` | More breathing room |
| Action button | `w-8 h-8` | `min-w-11 min-h-11` | 44px touch target |
| Left padding | `pl-3` (12px) | `pl-3` (12px) | Same both |

## 10. Common Mistakes

### ❌ Using same guide width on mobile
```tsx
// Bad - wastes space on mobile
<TreeGuides depth={depth} />  // Always w-6
```

### ✅ Responsive guide width
```tsx
// Good - tighter on mobile
<TreeGuides depth={depth} isMobile />  // w-4 on mobile
```

---

### ❌ Chevron doesn't match guide width
```tsx
// Bad - chevron is w-6 but guides are w-4 on mobile
<TreeGuides depth={depth} isMobile />  // w-4
<div className="w-6">chevron</div>     // w-6 - MISALIGNED!
```

### ✅ Chevron matches guide width
```tsx
// Good - both w-4 on mobile
<TreeGuides depth={depth} isMobile />  // w-4
<div className="w-4">chevron</div>     // w-4 - aligned!
```

---

### ❌ Trying to do both layouts with responsive classes
```tsx
// Bad - unmaintainable
<div className="w-6 md:w-4 flex md:hidden ...">
```

### ✅ Separate desktop and mobile rows
```tsx
// Good - clear separation
<div className="hidden md:flex">Desktop layout</div>
<div className="md:hidden flex">Mobile layout</div>
```

## Summary

1. **Use `isMobile` prop** on TreeGuides to switch between `w-6` (desktop) and `w-4` (mobile)
2. **Match chevron container width** to guide width exactly
3. **Render two separate rows** - one `hidden md:flex`, one `md:hidden flex`
4. **Increase touch targets** on mobile - `min-h-14`+ rows, `min-w-11` buttons
5. **Stack data below name** on mobile instead of horizontal columns
6. **Keep `pl-3` left padding** the same on both breakpoints

The result: perfectly aligned tree lines on any screen size, with appropriate spacing for touch interaction.
