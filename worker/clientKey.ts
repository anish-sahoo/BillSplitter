// What rate limits count against. IPv4 addresses are used as they are. An
// IPv6 client usually controls a whole /64, so it gets one bucket for the
// prefix instead of 2^64 of them.
export function clientKey(ip: string): string {
  if (!ip.includes(":")) return ip;

  const [head, tail = ""] = ip.split("::");
  const left = head ? head.split(":") : [];
  const right = tail ? tail.split(":") : [];
  const zeros = Array<string>(8 - left.length - right.length).fill("0");
  const groups = [...left, ...zeros, ...right];

  return `${groups
    .slice(0, 4)
    .map((group) => Number.parseInt(group, 16).toString(16))
    .join(":")}::/64`;
}
