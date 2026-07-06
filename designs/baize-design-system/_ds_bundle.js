/* @ds-bundle: {"format":3,"namespace":"BaizeDesignSystem_51d865","components":[{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Card","sourcePath":"components/core/Card.jsx"},{"name":"ContactForm","sourcePath":"components/core/ContactForm.jsx"},{"name":"SectionHeader","sourcePath":"components/core/SectionHeader.jsx"},{"name":"SiteHeader","sourcePath":"components/core/SiteHeader.jsx"}],"sourceHashes":{"components/core/Badge.jsx":"0936e3e61c03","components/core/Button.jsx":"76fb130ab8e9","components/core/Card.jsx":"20dd42b02b79","components/core/ContactForm.jsx":"6709c7cde12f","components/core/SectionHeader.jsx":"59a6065c1c6c","components/core/SiteHeader.jsx":"b40eaad1c30c"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.BaizeDesignSystem_51d865 = window.BaizeDesignSystem_51d865 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/core/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Badge({
  children,
  tone = "neutral",
  className = "",
  ...rest
}) {
  const classes = ["bz-badge", `bz-badge--${tone}`, className].filter(Boolean).join(" ");
  return /*#__PURE__*/React.createElement("span", _extends({
    className: classes
  }, rest), children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Button({
  children,
  variant = "primary",
  size = "md",
  icon = null,
  className = "",
  as = "button",
  ...rest
}) {
  const Component = as;
  const classes = ["bz-button", `bz-button--${variant}`, size !== "md" ? `bz-button--${size}` : "", className].filter(Boolean).join(" ");
  return /*#__PURE__*/React.createElement(Component, _extends({
    className: classes
  }, rest), icon ? /*#__PURE__*/React.createElement("span", {
    className: "bz-button__icon",
    "aria-hidden": "true"
  }, icon) : null, /*#__PURE__*/React.createElement("span", null, children));
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Card({
  eyebrow,
  title,
  children,
  action = null,
  className = "",
  ...rest
}) {
  const classes = ["bz-card", className].filter(Boolean).join(" ");
  return /*#__PURE__*/React.createElement("article", _extends({
    className: classes
  }, rest), eyebrow ? /*#__PURE__*/React.createElement("div", {
    className: "bz-card__eyebrow"
  }, eyebrow) : null, title ? /*#__PURE__*/React.createElement("h3", {
    className: "bz-card__title"
  }, title) : null, children ? /*#__PURE__*/React.createElement("div", {
    className: "bz-card__body"
  }, children) : null, action);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Card.jsx", error: String((e && e.message) || e) }); }

// components/core/ContactForm.jsx
try { (() => {
function ContactForm({
  title = "预约 AI 落地诊断",
  description = "告诉我们你的团队现状和最想解决的问题，我们会判断适合从哪里开始。",
  services = ["AI 中转站", "研发流程搭建", "AI 编程培训", "Skills 编写"],
  className = ""
}) {
  const classes = ["bz-contact-form", className].filter(Boolean).join(" ");
  return /*#__PURE__*/React.createElement("form", {
    className: classes
  }, /*#__PURE__*/React.createElement("div", {
    className: "bz-section-header"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bz-section-header__eyebrow"
  }, "Contact"), /*#__PURE__*/React.createElement("h2", {
    className: "bz-section-header__title"
  }, title), /*#__PURE__*/React.createElement("p", {
    className: "bz-section-header__body"
  }, description)), /*#__PURE__*/React.createElement("div", {
    className: "bz-field"
  }, /*#__PURE__*/React.createElement("label", {
    htmlFor: "baize-name"
  }, "\u59D3\u540D"), /*#__PURE__*/React.createElement("input", {
    id: "baize-name",
    name: "name",
    autoComplete: "name"
  })), /*#__PURE__*/React.createElement("div", {
    className: "bz-field"
  }, /*#__PURE__*/React.createElement("label", {
    htmlFor: "baize-company"
  }, "\u516C\u53F8 / \u56E2\u961F"), /*#__PURE__*/React.createElement("input", {
    id: "baize-company",
    name: "company",
    autoComplete: "organization"
  })), /*#__PURE__*/React.createElement("div", {
    className: "bz-field"
  }, /*#__PURE__*/React.createElement("label", {
    htmlFor: "baize-contact"
  }, "\u8054\u7CFB\u65B9\u5F0F"), /*#__PURE__*/React.createElement("input", {
    id: "baize-contact",
    name: "contact",
    autoComplete: "email"
  })), /*#__PURE__*/React.createElement("div", {
    className: "bz-field"
  }, /*#__PURE__*/React.createElement("label", {
    htmlFor: "baize-service"
  }, "\u611F\u5174\u8DA3\u7684\u670D\u52A1"), /*#__PURE__*/React.createElement("select", {
    id: "baize-service",
    name: "service"
  }, services.map(service => /*#__PURE__*/React.createElement("option", {
    key: service
  }, service)))), /*#__PURE__*/React.createElement("div", {
    className: "bz-field"
  }, /*#__PURE__*/React.createElement("label", {
    htmlFor: "baize-problem"
  }, "\u5F53\u524D\u6700\u60F3\u89E3\u51B3\u7684\u95EE\u9898"), /*#__PURE__*/React.createElement("textarea", {
    id: "baize-problem",
    name: "problem"
  })), /*#__PURE__*/React.createElement("button", {
    className: "bz-button bz-button--primary bz-button--lg",
    type: "submit"
  }, "\u63D0\u4EA4\u54A8\u8BE2\u9700\u6C42"));
}
Object.assign(__ds_scope, { ContactForm });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/ContactForm.jsx", error: String((e && e.message) || e) }); }

// components/core/SectionHeader.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function SectionHeader({
  eyebrow,
  title,
  children,
  className = "",
  ...rest
}) {
  const classes = ["bz-section-header", className].filter(Boolean).join(" ");
  return /*#__PURE__*/React.createElement("header", _extends({
    className: classes
  }, rest), eyebrow ? /*#__PURE__*/React.createElement("div", {
    className: "bz-section-header__eyebrow"
  }, eyebrow) : null, /*#__PURE__*/React.createElement("h2", {
    className: "bz-section-header__title"
  }, title), children ? /*#__PURE__*/React.createElement("p", {
    className: "bz-section-header__body"
  }, children) : null);
}
Object.assign(__ds_scope, { SectionHeader });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/SectionHeader.jsx", error: String((e && e.message) || e) }); }

// components/core/SiteHeader.jsx
try { (() => {
function SiteHeader({
  navItems = [],
  ctaLabel = "预约咨询",
  ctaHref = "#contact",
  logoSrc = null,
  logoAlt = "白泽明理 Baize Tech",
  className = ""
}) {
  const classes = ["bz-site-header", className].filter(Boolean).join(" ");
  return /*#__PURE__*/React.createElement("header", {
    className: classes
  }, /*#__PURE__*/React.createElement("div", {
    className: "bz-shell bz-site-header__inner"
  }, /*#__PURE__*/React.createElement("a", {
    className: "bz-site-header__brand",
    href: "/"
  }, logoSrc ? /*#__PURE__*/React.createElement("img", {
    className: "bz-site-header__logo",
    src: logoSrc,
    alt: logoAlt
  }) : null, /*#__PURE__*/React.createElement("span", {
    className: "bz-site-header__wordmark"
  }, /*#__PURE__*/React.createElement("span", {
    className: "bz-site-header__mark"
  }, "\u767D\u6CFD\u660E\u7406"), /*#__PURE__*/React.createElement("span", {
    className: "bz-site-header__latin"
  }, "Baize Tech"))), /*#__PURE__*/React.createElement("nav", {
    className: "bz-site-header__nav",
    "aria-label": "\u4E3B\u5BFC\u822A"
  }, navItems.map(item => /*#__PURE__*/React.createElement("a", {
    key: item.href,
    href: item.href
  }, item.label))), /*#__PURE__*/React.createElement("a", {
    className: "bz-button bz-button--primary",
    href: ctaHref
  }, ctaLabel)));
}
Object.assign(__ds_scope, { SiteHeader });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/SiteHeader.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.ContactForm = __ds_scope.ContactForm;

__ds_ns.SectionHeader = __ds_scope.SectionHeader;

__ds_ns.SiteHeader = __ds_scope.SiteHeader;

})();
