/**
 * rteClient — Real-Time Events transport layer.
 *
 * Encapsulates the WebSocket connection to the broker and exposes a typed
 * event-emitter interface so consumers (e.g. the Connect Four game board) can
 * handle domain messages without knowing anything about the transport.
 *
 * Design goals:
 * - Game-agnostic: the client sends/receives raw typed envelopes; callers
 *   register handlers for the message types they care about.
 * - Reconnect-ready: reconnect delay is configurable and the structure
 *   supports adding exponential/progressive backoff later.
 * - Fail-loud: parse errors are logged rather than silently swallowed.
 */

// ---------------------------------------------------------------------------
// Message envelope types
// ---------------------------------------------------------------------------

/** All message types flowing over the WebSocket. */
export enum RteMessageType {
  // Client → Broker
  Subscribe   = "subscribe",
  PlayerMoved = "player_moved",

  // Broker → Client
  GameState   = "game_state",
  SteveMoved  = "steve_moved",

  // Generic status/progress events (future use)
  Status      = "status",
}

/** Base shape every message must satisfy. */
export interface RteEnvelope {
  type: RteMessageType;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Reconnect config
// ---------------------------------------------------------------------------

export interface RteReconnectConfig {
  /** Initial delay in ms before the first reconnect attempt. Default: 5000. */
  initialDelayMs: number;
  /**
   * Multiplier applied to the delay after each failed attempt (≥1).
   * Set to 1 for constant backoff; >1 for exponential backoff. Default: 1.
   */
  backoffFactor: number;
  /** Maximum reconnect delay in ms. Default: 30000. */
  maxDelayMs: number;
}

const DEFAULT_RECONNECT: RteReconnectConfig = {
  initialDelayMs: 5000,
  backoffFactor: 1,     // constant for now; bump to 1.5–2 when ready
  maxDelayMs: 30000,
};

// ---------------------------------------------------------------------------
// Handler / listener types
// ---------------------------------------------------------------------------

type MessageHandler = (envelope: RteEnvelope) => void;
type ConnectionHandler = () => void;

// ---------------------------------------------------------------------------
// RteClient
// ---------------------------------------------------------------------------

export interface RteClientOptions {
  /** WebSocket broker URL (e.g. wss://example.com/connect4-ws). */
  url: string;
  reconnect?: Partial<RteReconnectConfig>;
}

export class RteClient {
  private readonly url: string;
  private readonly reconnect: RteReconnectConfig;

  private ws: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private destroyed = false;

  private messageHandlers: MessageHandler[] = [];
  private openHandlers: ConnectionHandler[] = [];
  private closeHandlers: ConnectionHandler[] = [];

  constructor(options: RteClientOptions) {
    this.url = options.url;
    this.reconnect = { ...DEFAULT_RECONNECT, ...(options.reconnect ?? {}) };
  }

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  /** Open the WebSocket connection. Safe to call multiple times. */
  connect(): void {
    if (this.destroyed) return;
    this._clearReconnectTimer();
    this._openSocket();
  }

  /** Send a typed message to the broker. No-op if not connected. */
  send(envelope: RteEnvelope): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(envelope));
    }
  }

  /** Tear down the connection permanently (no more reconnects). */
  destroy(): void {
    this.destroyed = true;
    this._clearReconnectTimer();
    this.ws?.close();
    this.ws = null;
  }

  /** Register a handler for all incoming messages. */
  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.push(handler);
    return () => { this.messageHandlers = this.messageHandlers.filter(h => h !== handler); };
  }

  /** Register a handler called when the connection opens. */
  onOpen(handler: ConnectionHandler): () => void {
    this.openHandlers.push(handler);
    return () => { this.openHandlers = this.openHandlers.filter(h => h !== handler); };
  }

  /** Register a handler called when the connection closes. */
  onClose(handler: ConnectionHandler): () => void {
    this.closeHandlers.push(handler);
    return () => { this.closeHandlers = this.closeHandlers.filter(h => h !== handler); };
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  // -------------------------------------------------------------------------
  // Internal
  // -------------------------------------------------------------------------

  private _openSocket(): void {
    const ws = new WebSocket(this.url);
    this.ws = ws;

    ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.openHandlers.forEach(h => h());
    };

    ws.onmessage = (event) => {
      let envelope: RteEnvelope;
      try {
        envelope = JSON.parse(event.data as string) as RteEnvelope;
      } catch (err) {
        console.error("[rteClient] Failed to parse message:", err, "raw:", event.data);
        return;
      }
      this.messageHandlers.forEach(h => h(envelope));
    };

    ws.onclose = () => {
      this.ws = null;
      this.closeHandlers.forEach(h => h());
      if (!this.destroyed) this._scheduleReconnect();
    };

    ws.onerror = (err) => {
      console.error("[rteClient] WebSocket error:", err);
      ws.close();
    };
  }

  private _scheduleReconnect(): void {
    const { initialDelayMs, backoffFactor, maxDelayMs } = this.reconnect;
    const delay = Math.min(
      initialDelayMs * Math.pow(backoffFactor, this.reconnectAttempts),
      maxDelayMs,
    );
    this.reconnectAttempts++;
    this.reconnectTimer = setTimeout(() => this._openSocket(), delay);
  }

  private _clearReconnectTimer(): void {
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}
