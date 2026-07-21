export function workspaceChatChannel(workspaceId: string): string {
  return `workspace:${workspaceId}:chat`;
}

export function userNotificationChannel(userId: string): string {
  return `user:${userId}:notifications`;
}
