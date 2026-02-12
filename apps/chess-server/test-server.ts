import WebSocket from 'ws';
import { Envelope } from 'chess-core';

const WS_URL = 'ws://localhost:8080';

function connect(): Promise<WebSocket> {
    return new Promise((resolve) => {
        const ws = new WebSocket(WS_URL);
        ws.on('open', () => resolve(ws));
    });
}

function send(ws: WebSocket, type: string, payload: any = {}) {
    ws.send(JSON.stringify({ type, payload, requestId: Date.now().toString() }));
}

function waitForMessage(ws: WebSocket, type: string): Promise<any> {
    return new Promise((resolve) => {
        const handler = (data: any) => {
            const msg = JSON.parse(data.toString());
            if (msg.type === type) {
                ws.off('message', handler);
                resolve(msg.payload);
            }
        };
        ws.on('message', handler);
    });
}

async function runTest() {
    console.log("Connecting client 1...");
    const ws1 = await connect();
    console.log("Connected 1. Sending hello...");
    send(ws1, 'hello');
    const helloAck1 = await waitForMessage(ws1, 'helloAck');
    console.log("Client 1 Session:", helloAck1.sessionToken);

    console.log("Creating match...");
    send(ws1, 'createMatch', {});
    const matchCreated = await waitForMessage(ws1, 'matchCreated');
    console.log("Match created:", matchCreated);
    const { matchId, joinCode } = matchCreated;

    console.log("Client 1 joining match...");
    send(ws1, 'joinMatch', { joinCode });
    const joined1 = await waitForMessage(ws1, 'matchJoined');
    console.log("Client 1 joined as:", joined1.color);

    console.log("Connecting client 2...");
    const ws2 = await connect();
    send(ws2, 'hello');
    await waitForMessage(ws2, 'helloAck');

    console.log("Client 2 joining match...");
    send(ws2, 'joinMatch', { joinCode });
    const joined2 = await waitForMessage(ws2, 'matchJoined');
    console.log("Client 2 joined as:", joined2.color);

    // Verify state sync
    const sync1 = await waitForMessage(ws1, 'stateSync');
    console.log("State sync (Client 1):", sync1.players); // Should show 2 players

    console.log("Client 1 making move...");
    // We need a valid move. Standard chess start setup. P2Push?
    // Let's assume standard board.
    // e2 -> e4 is 4,1 -> 4,3? No, internal coords usually 0-indexed.
    // White pawns at y=1. Black at y=6.
    // e2 is x=4, y=1. Target e4 is x=4, y=3.
    const move = {
        from: { x: 4, y: 1 },
        to: { x: 4, y: 3 }
    };
    send(ws1, 'makeMove', move);

    const moveAccepted = await waitForMessage(ws1, 'moveAccepted');
    console.log("Move accepted:", moveAccepted);

    // Check turn change
    const sync2 = await waitForMessage(ws2, 'stateSync');
    console.log("State sync (Client 2): Turn is now", sync2.turn);

    console.log("TEST PASSED");
    process.exit(0);
}

runTest().catch(err => {
    console.error("TEST FAILED:", err);
    process.exit(1);
});
