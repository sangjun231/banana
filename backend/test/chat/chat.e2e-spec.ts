import { Test } from "@nestjs/testing";
import type { INestApplication } from "@nestjs/common";
import type { AddressInfo } from "net";
import { io, type Socket } from "socket.io-client";
import { AppModule } from "@/app.module";

const waitForEvent = <T>(socket: Socket, event: string, timeoutMs = 3000) =>
  new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`이벤트 타임아웃: ${event}`));
    }, timeoutMs);

    socket.once(event, (data) => {
      clearTimeout(timer);
      resolve(data as T);
    });
  });

describe("ChatGateway (e2e)", () => {
  let app: INestApplication;
  let baseUrl: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
    await app.listen(0);

    const address = app.getHttpServer().address() as AddressInfo;
    baseUrl = `http://localhost:${address.port}`;
  });

  afterAll(async () => {
    await app.close();
  });

  it("join 시 히스토리를 받고, message가 브로드캐스트된다", async () => {
    const client = io(baseUrl, { transports: ["websocket"] });

    await new Promise<void>((resolve) => {
      client.on("connect", () => resolve());
    });

    client.emit("join", { userId: "alice", peerId: "bob" });

    const history = await waitForEvent<{
      roomId: string;
      messages: unknown[];
    }>(client, "history");

    expect(history.roomId).toBe("alice_bob");
    expect(history.messages).toHaveLength(0);

    client.emit("message", {
      userId: "alice",
      peerId: "bob",
      content: "hello",
    });

    const message = await waitForEvent<{
      roomId: string;
      senderId: string;
      receiverId: string;
      content: string;
      createdAt: string;
    }>(client, "message");

    expect(message.roomId).toBe("alice_bob");
    expect(message.senderId).toBe("alice");
    expect(message.receiverId).toBe("bob");
    expect(message.content).toBe("hello");
    expect(message.createdAt).toBeDefined();

    client.disconnect();
  });
});
