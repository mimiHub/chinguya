export async function register() {
  if (
    process.env.NEXT_RUNTIME === "nodejs" &&
    process.env.NEXT_PUBLIC_API_MOCKING === "enabled"
  ) {
    const { server } = await import("@chinguya/mocks/node");
    server.listen({ onUnhandledRequest: "warn" });
  }
}
