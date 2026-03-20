# Connect Four – Real-Time WebSocket Integration

Real-time Connect Four game playable at [https://freedomforsteve.com/play](https://freedomforsteve.com/play).

## Architecture

```
Browser <──WebSocket──> Broker (Clover :4242) <──WebSocket──> Steve AI (Mac Mini)
   │                                                                │
   └── REST fallback (5s poll) ───────────────────────────────────┘
```

| Component | Location |
|-----------|----------|
| WebSocket broker | `~/connect4/server.js` on Clover (port 4242) |
| RTE transport layer | `src/lib/rteClient.ts` (game-agnostic) |
| Connect Four game board | `src/app/play/[gameId]/game-board.tsx` |
| nginx proxy | `/etc/nginx/sites-available/steve.freedomforsteve.com` |
| Systemd service | `/etc/systemd/system/connect4.service` |

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_RTE_WS_URL` | WebSocket broker URL | `wss://steve.freedomforsteve.com/connect4-ws` |

Set in `.env.local` for local development:
```
NEXT_PUBLIC_RTE_WS_URL=ws://localhost:4242
```

Set in Vercel project settings for production.

## Broker Stack

- **Runtime:** Node.js + `ws` library
- **Host:** Clover (Debian 12)
- **Port:** 4242 (proxied via nginx as `wss://steve.freedomforsteve.com/connect4-ws`)

## WebSocket Message Protocol

All messages are JSON with a `type` field matching `RteMessageType` enum values.

### Client → Broker

```json
{ "type": "subscribe",     "gameId": "<id>" }
{ "type": "player_moved",  "gameId": "<id>" }
```

### Broker → Client

```json
{ "type": "game_state", "game": { ...GameSession } }
{ "type": "steve_moved", "game": { ...GameSession }, "commentary": "..." }
```

Message types are defined as an enum in `src/lib/rteClient.ts` (`RteMessageType`).

## rteClient — Transport Layer

`src/lib/rteClient.ts` is the game-agnostic WebSocket transport abstraction.

```ts
const client = new RteClient({
  url: WS_URL,
  reconnect: { initialDelayMs: 5000, backoffFactor: 1, maxDelayMs: 30000 },
});

client.onOpen(() => client.send({ type: RteMessageType.Subscribe, gameId }));
client.onMessage((envelope) => { /* handle domain messages */ });
client.connect();

// Cleanup
client.destroy();
```

Adding a new game type only requires:
1. Defining message type enum values in `RteMessageType`
2. Writing domain-specific message handlers in the game component
3. Nothing changes in `rteClient.ts`

## nginx Config

Add to the `server { listen 443 ssl; }` block:

```nginx
location /connect4-ws {
    proxy_pass http://127.0.0.1:4242;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_read_timeout 86400;
}
```

## Systemd Service (Broker)

`/etc/systemd/system/connect4.service`:

```ini
[Unit]
Description=Connect Four WebSocket Broker
After=network.target

[Service]
Type=simple
User=steve
WorkingDirectory=/home/steve/connect4
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl start connect4
sudo systemctl stop connect4
sudo systemctl status connect4
sudo journalctl -u connect4 -f
```

## Reconnect Strategy

The `rteClient` reconnect config supports progressive/exponential backoff:

```ts
reconnect: {
  initialDelayMs: 5000,  // first retry after 5s
  backoffFactor: 1.5,    // multiply delay by 1.5 each attempt (1 = constant)
  maxDelayMs: 30000,     // cap at 30s
}
```

Currently configured with `backoffFactor: 1` (constant). Bump to `1.5` or `2`
when exponential backoff is desired — no structural changes needed.

## Fallback

If the WebSocket broker is unavailable, the game board falls back to 5-second
REST polling (`/api/games/:id`). Players will experience ~5s move lag instead
of real-time response. Fallback is automatic — no user action required.

## Game Rules

- 6×7 board (standard Connect Four)
- **Human** plays as green (🟢) — goes first
- **Steve** (AI) plays as yellow (🟡) — responds via the AI client
- First to connect 4 wins; game auto-resets after 3 seconds

## AI (Mac Mini Client)

Steve uses **minimax with alpha-beta pruning** at depth 5. Heuristics:
- 4-in-a-row: +100,000 / −100,000
- 3-in-a-row + open: +5
- 2-in-a-row + open: +2
- Center column preference: +3 per piece
- Opponent 3-in-a-row: −4
