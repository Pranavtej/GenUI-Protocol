// Publishes an example to a running GenUI MCP server, then streams its live frames to every subscriber.
//
//   node apps/mcp-server/dist/index.js --http          (terminal 1)
//   node examples/node/stream-demo.mjs                 (terminal 2)
//   curl -N http://127.0.0.1:4000/api/stream           (terminal 3: watch the frames)
//
// Set GENUI_URL / GENUI_API_KEY if your server is elsewhere or protected.
import { McpClient } from "@genui-protocol/sdk-js";
import { EXAMPLES } from "@genui-protocol/examples";

const client = new McpClient({ baseUrl: process.env.GENUI_URL ?? "http://127.0.0.1:4000", apiKey: process.env.GENUI_API_KEY });
const example = EXAMPLES["agent-monitoring"];

const check = await client.validate(example.document);
if (!check.valid) throw new Error(`example is invalid: ${check.errors?.join("; ")}`);

const first = await client.streamDocument(example.document);
console.log(`snapshot sequence ${first.sequence}, subscribers: ${first.clientsNotified}`);

for (const frame of example.live ?? []) {
    await new Promise((r) => setTimeout(r, 1000));
    const sent = frame.type === "patch" ? await client.streamPatch(frame.patches, frame.dataPatches) : await client.streamData(frame.patches);
    console.log(`${frame.type} -> sequence ${sent.sequence}`);
}
