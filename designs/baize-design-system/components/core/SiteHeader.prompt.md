Use `SiteHeader` on every website page.

```jsx
<SiteHeader
  logoSrc="/assets/baize-mark.png"
  navItems={[
    { label: "服务", href: "/services" },
    { label: "明理笔记", href: "/notes" },
    { label: "方法论", href: "/method" },
    { label: "关于白泽", href: "/about" },
  ]}
/>
```

The header stays simple: brand, primary nav, and one consultation CTA.
Use the mark-only logo in small headers; reserve the full lockup for Hero and brand cards.
