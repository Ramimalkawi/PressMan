import React from "react";
import { useOrders, getStepStatuses } from "../state/orders";
import { useJobImages } from "../state/jobImages";
import { formatDateTimeDMY } from "../utils/date";
import pressMachineIcon from "../assets/press-machine.png";

export default function OrderTimeline({ order }) {
  const { getOrderSteps } = useOrders();
  const { getJobImage } = useJobImages();
  const [jobImage, setJobImageUrl] = React.useState(null);
  React.useEffect(() => { getJobImage(order.id).then(setJobImageUrl); }, [order.id]);
  const orderSteps = getOrderSteps(order);
  const statuses = getStepStatuses(order, orderSteps);
  const history = Array.isArray(order.history) ? order.history : [];
  const stageTimings = orderSteps.map((_, idx) => {
    const activatedEntry = history.filter((h) => h.step === idx && h.action === "activated").at(-1);
    const completedEntry = history.filter((h) => h.step === idx && h.action === "completed").at(-1);
    return { enterTs: activatedEntry?.ts ?? null, completeTs: completedEntry?.ts ?? null };
  });

  const formatDuration = (start, end) => {
    if (!start || !end) return "—";
    const ms = Math.max(0, end - start);
    const sec = Math.floor(ms / 1000);
    const min = Math.floor(sec / 60);
    const hr = Math.floor(min / 60);
    const day = Math.floor(hr / 24);
    if (day) return `${day}d ${hr % 24}h`;
    if (hr) return `${hr}h ${min % 60}m`;
    if (min) return `${min}m ${sec % 60}s`;
    return `${sec}s`;
  };

  return (
    <div className="timeline">
      <div className="timeline-head">
        {jobImage && (
          <img
            src={jobImage}
            alt="Job artwork"
            style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 6, border: "1px solid var(--border)", flexShrink: 0 }}
          />
        )}
        <div className="title">
          {order.orderNumber ? `#${order.orderNumber} — ` : ""}{order.jobName} — {order.customerName}
        </div>
        <div className="meta">
          Qty: {order.quantity}
          {order.pressMachine && (
            <span style={{ marginLeft: 8, display: "inline-flex", alignItems: "center", gap: 4 }}>
              <img src={pressMachineIcon} alt="" style={{ width: 16, height: 16, objectFit: "contain" }} />
              {order.pressMachine}
            </span>
          )}
        </div>
      </div>

      <div className="timeline-track">
        {orderSteps.map((s, idx) => (
          <div
            key={s}
            className={`timeline-step ${statuses[idx] === "completed" ? "done" : statuses[idx] === "active" ? "active" : ""}`}
          >
            <div className="dot" />
            <div className="label">{s}</div>
            <div className="tooltip">
              <div className="tooltip-title">{s}</div>
              <div className="tooltip-row">
                <span>Entered</span>
                <strong>{formatDateTimeDMY(stageTimings[idx].enterTs)}</strong>
              </div>
              <div className="tooltip-row">
                <span>Completed</span>
                <strong>
                  {formatDateTimeDMY(stageTimings[idx].completeTs)}
                </strong>
              </div>
              <div className="tooltip-row">
                <span>Time in Stage</span>
                <strong>
                  {formatDuration(
                    stageTimings[idx].enterTs,
                    stageTimings[idx].completeTs,
                  )}
                </strong>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
