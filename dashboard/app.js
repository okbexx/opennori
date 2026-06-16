const shell = document.querySelector(".shell");
const goalEl = document.querySelector("#goal");
const agentEl = document.querySelector("#agent");
const gapEl = document.querySelector("#gap");
const needUserEl = document.querySelector("#need-user");
const decisionEl = document.querySelector("#decision");
const architectureEl = document.querySelector("#architecture");

function shortText(value, fallback = "none") {
  const text = String(value || "").trim();
  if (!text) return fallback;
  return text.length > 92 ? `${text.slice(0, 89)}...` : text;
}

function decisionLabel(decision) {
  if (decision === "complete") return "complete";
  if (decision === "review_risk") return "objectively complete with review risk";
  if (decision === "no_active_goal") return "no active goal";
  return "not complete yet";
}

async function loadSnapshot() {
  const response = await fetch("/api/snapshot", { cache: "no-store" });
  const payload = await response.json();
  if (!payload.ok) throw new Error(payload.error?.message || "snapshot failed");
  render(payload.data);
}

function render(snapshot) {
  const agent = snapshot.agent || {};
  const architecture = snapshot.architecture || {};
  shell.dataset.state = agent.state || "idle";
  shell.dataset.needUser = snapshot.need_user ? "true" : "false";
  shell.dataset.decision = snapshot.decision || "not_complete";

  goalEl.textContent = shortText(snapshot.goal?.label, "No active goal");
  agentEl.textContent = `${agent.name || "Agent"} ${agent.state || "idle"}`;
  gapEl.textContent = snapshot.current_gap
    ? shortText(snapshot.current_gap.label || snapshot.current_gap.id)
    : snapshot.status === "no_active_goal"
      ? "No active Nori Contract"
      : "No current gap";
  needUserEl.textContent = snapshot.need_user ? "yes" : "no";
  decisionEl.textContent = decisionLabel(snapshot.decision);
  architectureEl.textContent = architecture.profile_title || architecture.profile || architecture.decision || "unknown";
}

function connectEvents() {
  const events = new EventSource("/api/events");
  events.onmessage = loadSnapshot;
  events.onerror = () => {
    setTimeout(loadSnapshot, 1200);
  };
}

loadSnapshot().catch(() => {});
connectEvents();
setInterval(() => {
  loadSnapshot().catch(() => {});
}, 5000);
