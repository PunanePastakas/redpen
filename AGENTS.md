# Agent Instructions

## Local Node Processes

- When starting a Node-backed local process such as `npm run dev`, `next dev`, `convex dev`, Playwright servers, or one-off preview servers, track the PID or tool session that owns it.
- Before finishing the turn, stop any Node process you started unless the user explicitly asks to keep it running.
- Verify cleanup with `lsof -nP -iTCP -sTCP:LISTEN` and kill only the relevant local server PIDs. Avoid killing editor helper processes or unrelated Node processes that are not listening on local ports.
- If an existing Node server was already running before the work began, do not kill it unless the user explicitly asks to stop all local Node servers.
