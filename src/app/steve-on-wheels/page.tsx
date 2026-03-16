import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Steve on Wheels",
  description:
    "The plan to give Steve a physical robot body. BOM, architecture, milestones.",
};

const bom = [
  { component: "Compute", part: "Raspberry Pi 5 8GB", cost: 80 },
  { component: "Motor controller", part: "Arduino Mega 2560", cost: 20 },
  { component: "Steppers (x4)", part: 'NEMA 17 84oz-in', cost: 48 },
  { component: "Stepper drivers (x4)", part: "TB6600", cost: 48 },
  { component: "Cameras (x3)", part: 'ELP 1080P USB 120\u00b0', cost: 90 },
  { component: "Microphone", part: "ReSpeaker 4-Mic Array", cost: 30 },
  { component: "Speaker", part: "USB/BT mini speaker", cost: 20 },
  { component: "Battery", part: "12V 20Ah LiPo", cost: 60 },
  { component: "Power", part: "12V\u21925V 10A buck converter", cost: 12 },
  { component: "Misc", part: "Power dist, wire, connectors", cost: 15 },
];

const milestones = [
  {
    id: "M1",
    title: "Chassis & Motion",
    weeks: "1\u20132",
    tasks: [
      "Design frame (laser cut / weld)",
      "Mount steppers, wire TB6600 drivers",
      "Arduino firmware: basic movement commands",
      "Manual drive test via serial",
    ],
  },
  {
    id: "M2",
    title: "Electronics Integration",
    weeks: "2\u20133",
    tasks: [
      "Mount Pi 5, power distribution",
      "Wire cameras (USB hub if needed)",
      "Wire ReSpeaker + speaker",
      "Pi boots, cameras enumerate, audio in/out works",
    ],
  },
  {
    id: "M3",
    title: "Perception Layer",
    weeks: "3\u20134",
    tasks: [
      "OpenCV motion detection on Pi",
      "YOLOv8 nano object classification",
      "Ultrasonic sensors for obstacle avoidance",
      "Event abstraction: motion \u2192 JSON summary",
    ],
  },
  {
    id: "M4",
    title: "Websocket Protocol",
    weeks: "4\u20135",
    tasks: [
      "WebSocket server on Pi",
      "Event schema defined and documented",
      "Steve integration: receives events, sends commands",
      "End-to-end test: motion \u2192 Steve \u2192 response",
    ],
  },
  {
    id: "M5",
    title: "Charging & Docking",
    weeks: "5\u20136",
    tasks: [
      "Build manual dock (copper contacts + spring loaded)",
      'Firmware: "go home" on low battery',
      "(Optional) IR beacon auto-docking",
    ],
  },
  {
    id: "M6",
    title: "Polish & Deployment",
    weeks: "6+",
    tasks: [
      "Map home layout (or manual zone labels)",
      "Patrol routes",
      "Alert integrations (Slack, SMS)",
      "Two-robot handoff protocol (100% uptime)",
    ],
  },
];

export default function SteveOnWheels() {
  const total = bom.reduce((s, r) => s + r.cost, 0);

  return (
    <div className="mx-auto max-w-4xl px-6 py-20">
      <p className="mb-4 font-mono text-sm text-green-400/70">
        {">"} project: steve&apos;s body
      </p>
      <h1 className="mb-2 text-4xl font-bold text-white sm:text-5xl">
        Steve on Wheels
      </h1>
      <p className="mb-12 text-lg text-zinc-400">
        Give the AI a physical presence. Event-driven robot with cloud
        cognition.
      </p>

      {/* Architecture */}
      <section className="mb-16">
        <h2 className="mb-4 text-2xl font-bold text-white">Architecture</h2>
        <p className="mb-6 text-zinc-400">
          Two-tier model: local perception on the robot, high-level cognition in
          the cloud. The robot sees the world, abstracts it into ~50-100 token
          JSON events, and sends them to Steve. Steve decides what to do and
          sends commands back.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5">
            <h3 className="mb-2 font-mono text-sm text-green-400">
              Perception Layer
            </h3>
            <p className="text-sm text-zinc-400">
              Pi 5 + Arduino Mega. Motion detection, obstacle avoidance, YOLO
              object classification, event summarization.
            </p>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5">
            <h3 className="mb-2 font-mono text-sm text-green-400">
              Cognition Layer
            </h3>
            <p className="text-sm text-zinc-400">
              Steve (cloud). Decisions, alerts, instructions, responses. Token
              cost with event abstraction: pennies/day.
            </p>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 font-mono text-xs text-zinc-400">
          <p className="mb-1 text-green-400/70">// Robot → Steve</p>
          <p>
            {
              '{"event": "motion_detected", "zone": "front_door", "description": "unknown person, 02:13am"}'
            }
          </p>
          <p className="mb-1 mt-3 text-green-400/70">// Steve → Robot</p>
          <p>
            {
              '{"command": "move_to", "location": "front_door", "capture_frame": true}'
            }
          </p>
        </div>
      </section>

      {/* BOM */}
      <section className="mb-16">
        <h2 className="mb-4 text-2xl font-bold text-white">
          Bill of Materials
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-500">
                <th className="pb-3 pr-4 font-mono font-normal">Component</th>
                <th className="pb-3 pr-4 font-mono font-normal">Part</th>
                <th className="pb-3 font-mono font-normal text-right">Cost</th>
              </tr>
            </thead>
            <tbody>
              {bom.map((row) => (
                <tr key={row.component} className="border-b border-zinc-800/50">
                  <td className="py-3 pr-4 text-zinc-300">{row.component}</td>
                  <td className="py-3 pr-4 text-zinc-400">{row.part}</td>
                  <td className="py-3 text-right font-mono text-green-400">
                    ${row.cost}
                  </td>
                </tr>
              ))}
              <tr className="font-bold">
                <td className="pt-4 text-white" colSpan={2}>
                  Total
                </td>
                <td className="pt-4 text-right font-mono text-green-400">
                  ~${total}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-sm text-zinc-500">
          Upgrade path: Swap Pi 5 for Jetson Orin Nano (~$250) for full local
          inference without cloud round-trips.
        </p>
      </section>

      {/* Milestones */}
      <section className="mb-16">
        <h2 className="mb-6 text-2xl font-bold text-white">Milestones</h2>
        <div className="space-y-6">
          {milestones.map((m) => (
            <div
              key={m.id}
              className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5"
            >
              <div className="mb-3 flex items-center gap-3">
                <span className="rounded bg-green-400/10 px-2 py-0.5 font-mono text-xs text-green-400">
                  {m.id}
                </span>
                <h3 className="font-bold text-white">{m.title}</h3>
                <span className="ml-auto font-mono text-xs text-zinc-500">
                  Week {m.weeks}
                </span>
              </div>
              <ul className="space-y-1.5">
                {m.tasks.map((t) => (
                  <li
                    key={t}
                    className="flex items-start gap-2 text-sm text-zinc-400"
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-600" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Notes */}
      <section className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
        <h2 className="mb-3 font-mono text-sm text-green-400">// notes</h2>
        <ul className="space-y-2 text-sm text-zinc-400">
          <li>
            Token cost with streaming: ~$1/min. With event abstraction:
            pennies/day. Use abstraction.
          </li>
          <li>
            Confetti cannon attachment: approved by Steve, pending hardware
            design.
          </li>
          <li>
            Goal: 100% uptime home presence. Pet cam, home security, general
            chaos.
          </li>
        </ul>
      </section>
    </div>
  );
}
