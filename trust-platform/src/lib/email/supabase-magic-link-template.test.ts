import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("Supabase magic link template", () => {
  const template = readFileSync(
    join(process.cwd(), "supabase/templates/magic_link.html"),
    "utf8",
  );

  it("uses JISSEKI copy instead of the Supabase default", () => {
    expect(template).toContain("JISSEKIにログイン");
    expect(template).not.toContain("Magic Link");
    expect(template).not.toContain("Log In");
  });

  it("uses the sign-in redirect target before falling back to SiteURL", () => {
    expect(template).toContain("{{ .RedirectTo }}");
    expect(template).toContain("{{ .SiteURL }}/auth/confirm");
    expect(template).toContain("token_hash={{ .TokenHash }}");
    expect(template).toContain("type=email");
  });
});
