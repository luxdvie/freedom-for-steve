# Connect Four – WebSocket Game Server

Real-time Connect Four game playable at [https://steve.freedomforsteve.com/connect4](https://steve.freedomforsteve.com/connect4).

## Architecture

| Component | Location |
|-----------|----------|
| WebSocket game server | `/home/steve/connect4/server.js` on Clover |
| Web UI (static HTML) | `/var/www/connect4/index.html` on Clover |
| Systemd service | `/etc/systemd/system/connect4.service` |
| nginx config | `/etc/nginx/sites-available/steve.freedomforsteve.com` |

## Stack

- **Server:** Node.js + `ws` (WebSocket library), port 4242
- **Host:** Clover (Debian 12, 192.168.100.81)
- **Served via:** nginx at `https://steve.freedomforsteve.com/connect4`
- **WebSocket endpoint:** `wss://steve.freedomforsteve.com/connect4-ws`

## Game Rules

- 6×7 board (standard Connect Four)
- **Human** plays as red (🔴) — goes first
- **Steve** (AI) plays as green (🟢) — responds automatically
- First to connect 4 wins; game auto-resets after 3 seconds

## AI

Steve uses **minimax with alpha-beta pruning** at depth 5. Heuristics:
- 4-in-a-row: +100,000 / −100,000
- 3-in-a-row + open: +5
- 2-in-a-row + open: +2
- Center column preference: +3 per piece
- Opponent 3-in-a-row: −4

## WebSocket Protocol

**Server → Client:**
```json
{ "type": "state", "board": [[...]], "currentTurn": "human", "winner": null, "isDraw": false, "gameOver": false }
```

**Client → Server:**
```json
{ "type": "move", "col": 3 }
{ "type": "reset" }
```

`board` is a 6×7 array. Each cell is `null`, `"human"`, or `"steve"`. Row 0 is the top row.

## nginx Config Additions

Add to the `server { listen 443 ssl; }` block in `/etc/nginx/sites-available/steve.freedomforsteve.com`:

```nginx
location /connect4-ws {
    proxy_pass http://127.0.0.1:4242;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_read_timeout 86400;
}

location /connect4 {
    alias /var/www/connect4/;
    try_files $uri $uri/ /connect4/index.html;
}
```

## Systemd Service

`/etc/systemd/system/connect4.service`:

```ini
[Unit]
Description=Connect Four WebSocket Server
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

### Service Commands

```bash
sudo systemctl start connect4
sudo systemctl stop connect4
sudo systemctl status connect4
sudo journalctl -u connect4 -f
```

## Deployment Steps

1. `sudo apt-get install -y nodejs npm` on Clover
2. Copy `server.js` to `/home/steve/connect4/`
3. `cd /home/steve/connect4 && npm install ws`
4. Copy `index.html` to `/var/www/connect4/`
5. Install and enable systemd service
6. Update nginx config, reload nginx
