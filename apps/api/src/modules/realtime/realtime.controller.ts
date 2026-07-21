import { Controller, MessageEvent, Param, Sse, UseGuards } from "@nestjs/common";
import { Observable, merge } from "rxjs";
import { map } from "rxjs/operators";
import { PermissionGuard } from "../rbac/guards/permission.guard";
import { CurrentUser } from "../rbac/decorators/current-user.decorator";
import { RealtimeService } from "./realtime.service";
import { workspaceChatChannel, userNotificationChannel } from "./channel-names";

@Controller("workspaces/:workspaceId/realtime")
@UseGuards(PermissionGuard)
export class RealtimeController {
  constructor(private readonly realtime: RealtimeService) {}

  /**
   * No @RequirePermission — PermissionGuard's fallback (any workspace member)
   * is exactly right here; there's nothing more specific to gate on.
   *
   * Server-Sent Events over a plain GET, not WebSockets — one-directional
   * (server → client) is all this needs (chat *sending* is a normal POST,
   * see ChatController), and SSE means no separate socket.io client/protocol
   * to stand up. Reconsider only if a genuinely bidirectional realtime
   * feature shows up later.
   */
  @Sse()
  stream(
    @Param("workspaceId") workspaceId: string,
    @CurrentUser() user: { id: string },
  ): Observable<MessageEvent> {
    const chat$ = this.realtime.observe(workspaceChatChannel(workspaceId));
    const notifications$ = this.realtime.observe(userNotificationChannel(user.id));

    return merge(chat$, notifications$).pipe(map((data) => ({ data })));
  }
}
