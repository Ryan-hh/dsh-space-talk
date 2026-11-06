// 离线冒烟：加载 dsh-space-talk 的客户端模块，验证注册契约与空格触发的前置判断
import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert";

const file = new URL("../lib/client.js", import.meta.url);
const src = fs.readFileSync(file, "utf8");
const filePath = file instanceof URL ? file.pathname.replace(/^\/(?=[A-Za-z]:)/, "") : String(file);

let spec = null;
const react = {
  createElement: () => null,
  useEffect: () => {},
  useRef: (v) => ({ current: v }),
  useState: (v) => [v, () => {}],
};

const sandbox = {
  console,
  setTimeout,
  clearTimeout,
  setInterval,
  clearInterval,
  Date,
  Math,
  JSON,
  Intl,
  URL,
  Blob,
  Promise,
  navigator: {},
  document: {
    addEventListener: () => {},
    querySelector: () => null,
    createElement: () => ({ dataset: {}, style: {}, appendChild() {}, setAttribute() {}, classList: { add() {}, remove() {} }, textContent: '' }),
    head: { appendChild() {} },
    body: { classList: { toggle() {}, add() {}, remove() {} }, appendChild() {} },
    activeElement: null,
  },
};
sandbox.window = sandbox;
sandbox.window.__ModuleLoader__ = { load: (s) => { spec = s; } };
sandbox.window.addEventListener = () => {};
vm.createContext(sandbox);
vm.runInContext(src, sandbox, { filename: filePath });

assert.ok(spec, "模块应通过 window.__ModuleLoader__.load 注册");
assert.equal(spec.id, "dsh-space-talk");
const mod = spec.factory((name) => {
  if (name === "react") return react;
  return {};
});
assert.equal(mod.name, "dsh-space-talk");
assert.deepEqual(mod.inject, ["slots"]);
assert.equal(typeof mod.apply, "function");
assert.ok(mod.__test && typeof mod.__test.createController === "function");

const cfg = {
  enabled: true,
  spaceHold: true,
  spaceOnlyWhenEmpty: true,
  holdThresholdMs: 400,
  cancelSlidePx: 60,
  interimIntervalMs: 1500,
  minHoldMs: 250,
  maxHoldMs: 60000,
  autoSend: true,
  minVoiceRms: 0.01,
  inline: true,
};

function makeUi(draftOf) {
  return {
    self: {},
    getConfig: () => cfg,
    getDraft: () => draftOf(),
    setPhase() {}, setInterim() {}, setArmed() {}, setMessage() {}, setMeter() {},
    setInline() {}, setLiveDraft() { return true; }, finishDraft() { return true; },
    clearMessageLater() {}, clearIfIdle() {}, insertText() { return true; }, onModelPreparing() {},
  };
}

const spaceEvent = (extra = {}) => ({
  key: " ", code: "Space", repeat: false, isComposing: false,
  ctrlKey: false, metaKey: false, altKey: false, shiftKey: false, ...extra,
});

// 1) 空输入框 + 空格：应当接管
const c1 = mod.__test.createController(makeUi(() => ""));
assert.equal(c1.onSpaceDown(spaceEvent()), true, "空草稿时空格应触发录音");
assert.equal(c1.isSpaceHolding(), true, "录音期间应处于空格按住态");
// 系统自动重复的 keydown：不能再开一次录音，但必须仍处于按住态（外层据此 preventDefault+stopPropagation）
assert.equal(c1.onSpaceDown(spaceEvent({ repeat: true })), false, "重复 keydown 不应重复开录");
assert.equal(c1.isSpaceHolding(), true, "重复 keydown 期间仍应阻止空格输入");
assert.equal(c1.onSpaceUp(spaceEvent()), true, "松开空格应结束");
assert.equal(c1.isSpaceHolding(), false, "松开后应清除按住态");

// 2) 有草稿：放行（当成普通空格）
const c2 = mod.__test.createController(makeUi(() => "已经写了一半"));
assert.equal(c2.onSpaceDown(spaceEvent()), false, "有草稿时不应触发");

// 3) 带修饰键：不接管
const c3 = mod.__test.createController(makeUi(() => ""));
assert.equal(c3.onSpaceDown(spaceEvent({ ctrlKey: true })), false, "Ctrl+空格不应接管");

// 4) 关闭 spaceHold：不接管
const saved = cfg.spaceHold;
cfg.spaceHold = false;
const c4 = mod.__test.createController(makeUi(() => ""));
assert.equal(c4.onSpaceDown(spaceEvent()), false, "spaceHold=false 时不应接管");
cfg.spaceHold = saved;

// 5) 输入法组合中的空格：不接管
const c5 = mod.__test.createController(makeUi(() => ""));
assert.equal(c5.onSpaceDown(spaceEvent({ isComposing: true })), false, "输入法组合态不应接管");

console.log("SMOKE_OK");
