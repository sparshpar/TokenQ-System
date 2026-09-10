const root = document.getElementById("staff-app");

async function loadQueue() {
  const res = await fetch("/api/queue");
  const queue = await res.json();
  render(queue);
  setTimeout(loadQueue, 3000);
}

function fmtEta(ts) {
  const d = new Date(ts * 1000);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function render(queue) {
  const busyCounters = new Set(queue.filter((o) => o.status === "preparing").map((o) => o.counter)).size;

  root.innerHTML = `
    <div class="staff-header">
      <div>
        <div class="brand">TokenQ &middot; kitchen</div>
        <div class="tagline">live queue, sorted by ready time</div>
      </div>
    </div>
    <div class="counter-status">
      <span><span class="dot ${busyCounters >= 1 ? "busy" : "free"}"></span>Counter 1</span>
      <span><span class="dot ${busyCounters >= 2 ? "busy" : "free"}"></span>Counter 2</span>
      <span>${queue.length} active order${queue.length === 1 ? "" : "s"}</span>
    </div>
    ${
      queue.length === 0
        ? `<div class="empty-note">No active orders. Queue is clear.</div>`
        : queue
            .map(
              (o) => `
      <div class="queue-row">
        <div class="queue-left">
          <div class="queue-token">${o.token} &middot; counter ${o.counter}</div>
          <div class="queue-items">${o.items.map((i) => `${i.name} x${i.qty}`).join(", ")}</div>
          <div class="queue-eta">ready by ${fmtEta(o.ready_at)} &middot; status: ${o.status}</div>
        </div>
        <button class="advance-btn ${o.status === "ready" ? "ready" : ""}" data-id="${o.id}">
          ${{ queued: "Start prep", preparing: "Mark ready", ready: "Picked up" }[o.status]}
        </button>
      </div>`
            )
            .join("")
    }
  `;

  root.querySelectorAll("[data-id]").forEach((btn) =>
    btn.addEventListener("click", async () => {
      await fetch(`/api/orders/${btn.dataset.id}/advance`, { method: "POST" });
      loadQueue();
    })
  );
}

loadQueue();