import { describe, expect, it } from "vitest";
import { clientKey } from "./clientKey";

describe("clientKey", () => {
  it("keeps IPv4 addresses as they are", () => {
    expect(clientKey("203.0.113.7")).toBe("203.0.113.7");
  });

  it("groups IPv6 addresses by /64", () => {
    expect(clientKey("2001:db8:85a3:1:aaaa:bbbb:cccc:dddd")).toBe("2001:db8:85a3:1::/64");
    expect(clientKey("2001:db8:85a3:1::1")).toBe("2001:db8:85a3:1::/64");
  });

  it("expands compressed and zero-padded groups", () => {
    expect(clientKey("2001:0DB8::1")).toBe("2001:db8:0:0::/64");
    expect(clientKey("::1")).toBe("0:0:0:0::/64");
  });
});
