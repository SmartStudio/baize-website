# Sub2API 企业私有 Codex 中转站配图

## 参考信息

- 文章源文件：`site/src/content/notes/ai-coding-compute-sourcing.mdx`
- Sub2API 官方仓库：<https://github.com/Wei-Shaw/sub2api>
- 官方功能线索：多账号管理、员工 API Key、账号调度、并发与速率限制、token 用量记录、管理后台。
- 视觉线索只采用网关、账号池、密钥、审计记录和服务器部署关系，不使用 Sub2API、OpenAI 或 Codex 的官方 Logo。
- 全套使用安全橙 `#FF6B35`，与同目录文章现有配图一致。

## 封面：企业私有中转站

输出路径：`site/src/content/notes/media/ai-coding-compute-sourcing-cover.png`

```text
Use case: stylized-concept
Asset type: 16:9 landscape article cover illustration
Primary request: An enterprise private Codex relay station shown as a sturdy physical gateway appliance. Three small developer laptop and terminal tiles connect from the left. A compact pool of anonymous upstream account cards and one abstract cloud model endpoint connect on the right. The gateway stays inside a thin outlined enterprise boundary and visibly contains a key slot, routing nodes, an audit ledger strip, and a shield. Make the left-to-right request flow easy to understand without text.
Style/medium: clean Swiss editorial 3D vector-like material illustration, warm off-white background, black ink outlines, refined white and gray physical surfaces, one vivid safety orange accent (#FF6B35).
Composition/framing: wide 16:9 landscape composition, central gateway as the focal point, balanced inputs and outputs, generous safe margins, full objects visible, no crop.
Lighting/mood: crisp soft studio light, calm technical and trustworthy mood, mild contact shadows.
Constraints: no words, no letters, no numbers, no logos, no watermark, no fake app chrome, no decorative blobs, no gradient background, no people, no dramatic cyberpunk effects.
```

## 图 1：移除商业中转商

输出路径：`site/src/content/notes/media/ai-coding-compute-sourcing-fig-1.png`

```text
Use case: infographic-diagram
Asset type: 16:9 landscape labeled material illustration for a Chinese technical article
Primary request: A before-and-after comparison with two clean horizontal request lanes. The upper lane shows an employee device passing prompts and code through an external commercial relay box before reaching an abstract upstream model cloud. The lower lane shows the employee device passing through a private gateway located inside a thin enterprise boundary before reaching the same upstream model cloud. Add a small audit ledger attached only to the private gateway. The diagram must make one fact clear: self-hosting removes the commercial intermediary, but requests still reach the upstream model.
Chinese labels: Add exactly five short printed callouts: "员工调用", "商业中转", "私有网关", "上游模型", "统一审计". Keep labels horizontal, large, high-contrast, attached to the correct objects, and away from edges.
Style/medium: clean Swiss editorial 3D vector-like material illustration, warm off-white background, black ink outlines, refined white and gray surfaces, one vivid safety orange accent (#FF6B35).
Composition/framing: wide 16:9 landscape composition, two parallel lanes with generous spacing, full diagram visible, centered vertically, safe margins on every side, no crop.
Lighting/mood: crisp studio light, calm analytical mood.
Constraints: no extra words beyond the five labels, no English, no logos, no watermark, no poster title, no dense legend, no decorative blobs, no gradient background, do not imply that the upstream model is inside the enterprise boundary.
```

## 图 2：服务器部署层级

输出路径：`site/src/content/notes/media/ai-coding-compute-sourcing-fig-2.png`

```text
Use case: infographic-diagram
Asset type: 16:9 landscape labeled material illustration for a Chinese deployment guide
Primary request: A physical layer-stack diagram inside one cloud server frame. At the top/front, a secure HTTPS entrance gate receives traffic. Behind it sits the gateway service module. Under that is a container runtime platform. At the bottom are three durable data-volume blocks with a small backup arrow. The full stack is enclosed by a United States VPS boundary. Show the vertical dependency clearly and keep the drawing simple enough for an article reader.
Chinese labels: Add exactly five short printed callouts: "HTTPS 入口", "网关服务", "容器运行", "数据备份", "美国 VPS". Keep labels horizontal, large, high-contrast, attached to the correct layer, and away from edges.
Style/medium: clean Swiss editorial 3D vector-like material illustration, warm off-white background, black ink outlines, refined white and gray surfaces, one vivid safety orange accent (#FF6B35).
Composition/framing: wide 16:9 landscape composition, one centered physical stack with a few side callouts, generous safe margins, full stack visible, no crop.
Lighting/mood: crisp studio light, calm technical mood, mild contact shadows.
Constraints: no extra words beyond the five labels, no logos, no watermark, no fake terminal UI, no poster title, no dense legend, no decorative blobs, no gradient background.
```

## 图 3：员工密钥到账号池

输出路径：`site/src/content/notes/media/ai-coding-compute-sourcing-fig-3.png`

```text
Use case: infographic-diagram
Asset type: 16:9 landscape labeled material illustration for a Chinese technical article
Primary request: A hub-and-spoke account scheduling diagram. On the left, four distinct employee cards each hold a different small key token. They feed into one central private gateway that groups and routes requests. On the right, three anonymous upstream account modules form an account pool. Below the gateway, a usage ledger records token meters and request rows. Orange connector lines make the flow and scheduling relationship obvious.
Chinese labels: Add exactly four short printed callouts: "员工密钥", "统一分组", "账号池", "用量审计". Keep labels horizontal, large, high-contrast, attached to the correct objects, and away from edges.
Style/medium: clean Swiss editorial 3D vector-like material illustration, warm off-white background, black ink outlines, refined white and gray surfaces, one vivid safety orange accent (#FF6B35).
Composition/framing: wide 16:9 landscape composition, employees on the left, routing hub in the center, account pool on the right, audit ledger below, generous safe margins, full diagram visible, no crop.
Lighting/mood: crisp studio light, calm analytical mood.
Constraints: no extra words beyond the four labels, no English, no logos, no watermark, no dense dashboard, no poster title, no decorative blobs, no gradient background.
```

## 生成记录

- 生成方式：Codex 内置 `image_gen`。
- 最终图片统一为 `1672 × 941`，与同目录文章封面和宽图尺寸一致。
- 图 3 首版被拒绝：中间设备多出“私有网关”，审计表格生成了未经提供的数字。修订版删除额外文字，把数字改为抽象刻度和圆点。
