import { Injectable, OnModuleDestroy } from "@nestjs/common";
import Redis from "ioredis";
import { Observable, Subject } from "rxjs";
import { filter, map } from "rxjs/operators";

interface RawMessage {
  channel: string;
  payload: string;
}

/**
 * Redis pub/sub, not an in-memory EventEmitter/Subject alone — this app is
 * meant to run as more than one apps/api instance behind a load balancer
 * (docs/adr/004-hosting-split.md), and an in-memory approach would only
 * deliver realtime events to whichever instance happened to publish them,
 * silently dropping delivery to clients connected to a different instance.
 *
 * One dedicated ioredis connection in subscribe mode (a subscriber
 * connection can't issue other commands, per Redis's own protocol — see
 * ioredis's docs), shared across every SSE connection this process serves;
 * fan-out to individual observers happens in-process via RxJS after that.
 */
@Injectable()
export class RealtimeService implements OnModuleDestroy {
  private readonly publisher: Redis;
  private readonly subscriber: Redis;
  private readonly messages$ = new Subject<RawMessage>();
  private readonly subscribedChannels = new Set<string>();

  constructor() {
    const url = process.env.REDIS_URL ?? "redis://localhost:6379";
    this.publisher = new Redis(url);
    this.subscriber = new Redis(url);

    this.subscriber.on("message", (channel: string, payload: string) => {
      this.messages$.next({ channel, payload });
    });
  }

  async publish(channel: string, event: Record<string, unknown>): Promise<void> {
    await this.publisher.publish(channel, JSON.stringify(event));
  }

  /**
   * Returns a hot Observable of parsed JSON events on `channel`. Multiple
   * calls for the same channel name share one underlying Redis SUBSCRIBE —
   * fan-out is in-process. Subscriptions are not torn down when observers
   * disconnect (a channel with no active listeners but an occasional
   * publish is cheap) — see TECH_DEBT.md if this ever needs to scale to a
   * very large number of distinct channel names over a long process
   * lifetime.
   */
  observe(channel: string): Observable<Record<string, unknown>> {
    if (!this.subscribedChannels.has(channel)) {
      this.subscribedChannels.add(channel);
      void this.subscriber.subscribe(channel);
    }

    return this.messages$.pipe(
      filter((m) => m.channel === channel),
      map((m) => JSON.parse(m.payload) as Record<string, unknown>),
    );
  }

  onModuleDestroy(): void {
    this.publisher.disconnect();
    this.subscriber.disconnect();
  }
}
