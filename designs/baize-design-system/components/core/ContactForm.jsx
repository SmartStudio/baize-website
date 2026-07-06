import React from "react";

export function ContactForm({
  title = "预约 AI 落地诊断",
  description = "告诉我们你的团队现状和最想解决的问题，我们会判断适合从哪里开始。",
  services = ["AI 中转站", "研发流程搭建", "AI 编程培训", "Skills 编写"],
  className = "",
}) {
  const classes = ["bz-contact-form", className].filter(Boolean).join(" ");

  return (
    <form className={classes}>
      <div className="bz-section-header">
        <div className="bz-section-header__eyebrow">Contact</div>
        <h2 className="bz-section-header__title">{title}</h2>
        <p className="bz-section-header__body">{description}</p>
      </div>
      <div className="bz-field">
        <label htmlFor="baize-name">姓名</label>
        <input id="baize-name" name="name" autoComplete="name" />
      </div>
      <div className="bz-field">
        <label htmlFor="baize-company">公司 / 团队</label>
        <input id="baize-company" name="company" autoComplete="organization" />
      </div>
      <div className="bz-field">
        <label htmlFor="baize-contact">联系方式</label>
        <input id="baize-contact" name="contact" autoComplete="email" />
      </div>
      <div className="bz-field">
        <label htmlFor="baize-service">感兴趣的服务</label>
        <select id="baize-service" name="service">
          {services.map((service) => (
            <option key={service}>{service}</option>
          ))}
        </select>
      </div>
      <div className="bz-field">
        <label htmlFor="baize-problem">当前最想解决的问题</label>
        <textarea id="baize-problem" name="problem" />
      </div>
      <button className="bz-button bz-button--primary bz-button--lg" type="submit">提交咨询需求</button>
    </form>
  );
}
