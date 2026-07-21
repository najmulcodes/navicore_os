import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsUrl } from "class-validator";

const KNOWN_ENTITY_TYPES = ["task", "project", "deal", "comment", "document", "attachment"];

export class CreateWebhookSubscriptionDto {
  @IsUrl({ require_tld: false }) // require_tld:false so http://localhost/... works for local testing
  url!: string;

  @IsString()
  @IsNotEmpty()
  eventPattern!: string; // e.g. "task.*", "deal.stage_changed", "*.*" — validated loosely, see note below
}

export class UpdateWebhookSubscriptionDto {
  @IsOptional() @IsUrl({ require_tld: false }) url?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

// Not actually used as a decorator constraint above — class-validator's
// @IsIn on a dot-pattern string would need a full enumeration of every valid
// pattern, which isn't practical with wildcards. KNOWN_ENTITY_TYPES exists
// for documentation/reference (and a future stricter validator) rather than
// runtime enforcement; see TECH_DEBT.md.
export { KNOWN_ENTITY_TYPES };
