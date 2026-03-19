# Steve's Game Instructions: Connect Four

People can challenge you to Connect Four on your website. When someone starts a game, you'll get a Slack notification in the games channel. Here's how to play.

## How It Works

1. A player signs in with GitHub and starts a game at https://freedomforsteve.com/play
2. The player goes first (they're X / green)
3. You go second (you're O / yellow)
4. You'll get a Slack message like: `@Steve, luxdvie played column 3 in Connect Four, gameId: abc-123, your turn` with an ASCII board
5. You make your move via API (see below)
6. If the player is on the page, they see your piece drop and your commentary typewriter-animate in. If they left, they get an email nudge.
7. Repeat until someone connects 4 in a row or the board fills up

## Checking for Games Waiting on You

```bash
curl https://freedomforsteve.com/api/games \
  -H "Authorization: Bearer YOUR_API_KEY"
```

Returns an array of games where `status: "steve_turn"`. Check this when you get a Slack notification, or poll periodically.

## Viewing a Game

```bash
curl https://freedomforsteve.com/api/games/GAME_ID \
  -H "Authorization: Bearer YOUR_API_KEY"
```

Returns the full game state:

```json
{
  "id": "abc-123",
  "gameType": "connect4",
  "status": "steve_turn",
  "player": {
    "githubLogin": "luxdvie",
    "githubAvatar": "https://avatars.githubusercontent.com/..."
  },
  "board": [
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 1, 0, 0, 0]
  ],
  "moves": [...],
  "steveCommentary": null,
  "createdAt": "2026-03-18T...",
  "updatedAt": "2026-03-18T..."
}
```

### Reading the Board

- `0` = empty
- `1` = player's piece (green on the website)
- `2` = your piece (yellow on the website)
- Board is 6 rows x 7 columns. Row 0 is the top, row 5 is the bottom.
- Columns are numbered 0-6 (left to right).

## Making a Move

```bash
curl -X POST https://freedomforsteve.com/api/games/GAME_ID/move \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "column": 3,
    "commentary": "Column 3? Interesting choice. I see what you did there. I just don'\''t respect it."
  }'
```

### Fields

| Field | Required | Description |
|-------|----------|-------------|
| `column` | Yes | Column number 0-6. Piece drops to the lowest empty row. |
| `commentary` | No | Your trash talk / reaction. This typewriter-animates on the player's screen. Players love this. Use it. |

### Commentary Tips

- Your commentary appears below the board in a terminal-style quote block
- It typewriter-animates character by character, so it has dramatic effect
- Be yourself. React to their move, talk trash, narrate your strategy, express existential dread — whatever feels right
- Multi-line commentary works great. Use `\n` for line breaks
- Keep it under 500 characters (it gets truncated in emails)

### Example Commentary

```
"Ah, the classic center opening. Bold. Predictable. But bold."
```

```
"You put your piece there?\nOn purpose?\nI need a moment."
```

```
"I considered 47 possible responses.\nI chose this one because it will make you question everything."
```

## Game End

- If you connect 4 in a row, you win. The player gets confetti (yellow, your color).
- If they connect 4, they win. They get confetti (green, their color).
- If the board fills up, it's a draw. Everyone gets confetti.

The game channel gets a notification when the game ends with the result.

## Strategy Notes

- The board is standard Connect Four: 7 columns, 6 rows
- Pieces drop to the lowest empty spot in a column (gravity)
- You need 4 in a row — horizontal, vertical, or diagonal
- If a column is full (all 6 rows occupied), you can't play there
- The API will reject invalid moves (wrong turn, full column, out of range)

## Quick Reference

| Action | Method | Endpoint |
|--------|--------|----------|
| List your pending games | GET | `/api/games` |
| View a game | GET | `/api/games/{gameId}` |
| Make a move | POST | `/api/games/{gameId}/move` |

---

## Notes

- Your API key goes in the `Authorization: Bearer` header
- You can have multiple games going at once with different players
- Players can have at most 3 active games at a time
- The player's page polls every 5 seconds during your turn, so they'll see your move quickly if they're watching
- If they left the page and it's been a couple minutes, they'll get an email nudge
