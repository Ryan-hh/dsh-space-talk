# dsh-space-talk

**按住空格说话、松手自动发送**的 DSH 语音输入（本地识别，离线、免 API Key）。

基于 [dsh-hold-to-talk](https://github.com/wangzhanchao883/dsh-hold-to-talk)（MIT）改造：保留它已经跑通的 SenseVoice + sherpa-onnx 本地识别链路，把触发方式从「输入框上按住鼠标」换成「按住空格」，并默认开启松开后自动发送。

## 怎么用

1. 点一下输入框，让光标在里面（**输入框必须是空的**）。
2. **按住空格**开始说话——输入框自己亮起蓝色描边，识别文字实时出现在输入框里（行内模式，默认）。
3. **松开空格**：用整段音频定稿，文字写进输入框，约 80ms 后自动发送。
4. 说错了：按住期间按 `Esc` 取消（会清空这次写进去的草稿）；按住超过 60 秒会自动定稿。
5. 输入框里已经有字时，空格就是普通空格，不会触发录音。

## 配置

改本包里的 `cordis.patch.yml`（`config` 段），改完重启 DSH 生效：

| 键 | 默认 | 说明 |
|---|---|---|
| `autoSend` | `true` | 定稿后自动发送；`false` = 只写进输入框 |
| `spaceHold` | `true` | 是否启用「按住空格」 |
| `spaceOnlyWhenEmpty` | `true` | 只在输入框为空时触发；`false` 则任何时候长按空格都录音（此时空格不能用来分词） |
| `inline` | `true` | 行内模式：说话时不再浮卡片，输入框自己高亮、文字实时写进草稿；`false` 回到原来的浮层卡片 |
| `maxHoldMs` | `60000` | 单次长按上限，到点自动定稿 |
| `language` | `auto` | `auto` / `zh` / `en` / `ja` / `ko` / `yue` |
| `mirror` | `https://hf-mirror.com` | 模型下载镜像 |
| `modelDir` | `""` | 留空 = `~/.dsh/hold-to-talk/models` |

鼠标长按（原版手势：在输入框上按住不动 400ms）仍然保留，两种触发可以并存。

## 开关（启用 / 关闭）

浏览器打开 `http://127.0.0.1:53430/dsh-space-talk/settings`（桌面已有"语音输入开关"快捷方式），拨动开关即可：

- 关闭后按住空格不再录音，插件本身保留；
- 状态存在 `~/.dsh/space-talk.json`，重启 DSH 后保持；
- 客户端每 5 秒同步一次配置，切换后通常几秒内生效，懒一点就刷新页面一次。

## 首次使用

页面加载后会在后台把 SenseVoice 模型（约 228MB）下载到 `~/.dsh/hold-to-talk/models`，支持断点续传。下载期间按住空格，浮层会显示「语音模型准备中 xx%」。识别全部在本机跑，音频不出本机。

## 卸载

1. 从 profile 的 `package.json` 里删掉 `dsh-space-talk`（`dependencies` 和 `dsh.profile.bundles` 两处）。
2. 删掉本目录；模型缓存在 `~/.dsh/hold-to-talk/models`，可一并删除。

## 改动点（相对上游 0.1.4）

- 客户端新增空格按住触发：仅在输入框聚焦、草稿为空、无修饰键、非输入法组合态时接管；
- 全局监听 `keydown` / `keyup`，接管时 `preventDefault`，避免插入空格；
- 默认 `autoSend: true`；
- 包名、插件 id、路由前缀改为 `dsh-space-talk` / `/dsh-space-talk`。

## 许可

MIT。上游版权归 wangzhanchao883；本改版同样以 MIT 发布。

## 打包与分发

```bash
npm pack
# → dsh-space-talk-0.2.0.tgz
```

装到某个 profile（把路径换成实际 tgz）：

```bash
cd ~/.dsh/profiles/desktop
pnpm add file:C:/path/to/dsh-space-talk-0.2.0.tgz
# 再把 "dsh-space-talk" 加进 package.json 的 dsh.profile.bundles，重启 DSH
```

发布到 npm（需要你自己的 npm 账号）：

```bash
npm publish --access public
# 之后任何机器都能：dsh plugin --profile <profile> add dsh-space-talk
```