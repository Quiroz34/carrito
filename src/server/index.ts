const server = Bun.serve({
    port: 3000,
    async fetch(req) {
        const url = new URL(req.url);
        if (url.pathname === "/") {
            return new Response(Bun.file("public/index.html"));
        } else if (url.pathname === "/styles.css") {
            return new Response(Bun.file("public/styles.css"), {
                headers: { "Content-Type": "text/css" }
            });
        } else if (url.pathname === "/game.js") {
            const result = await Bun.build({ entrypoints: ["src/client/game.ts"] });
            return new Response(result.outputs[0]);
        }
        return new Response("Not Found", { status: 404 });
    },
});

console.log(`Listening on http://localhost:${server.port} ...`);
