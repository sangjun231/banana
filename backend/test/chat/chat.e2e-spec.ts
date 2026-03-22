// ChatGateway E2E 테스트
// - 역할: WebSocket 채팅 기능의 통합 테스트
// - 테스트 항목: join(입장), message(메시지 전송/브로드캐스트)
// - 실행: pnpm test:e2e -- test/chat/chat.e2e-spec.ts

import { Test } from "@nestjs/testing";
import type { INestApplication } from "@nestjs/common";
import type { AddressInfo } from "net";
import { io, type Socket } from "socket.io-client";
import { AppModule } from "@/app.module";

/**
 * 소켓 이벤트를 Promise로 대기하는 헬퍼 함수
 * @param socket - socket.io 클라이언트
 * @param event - 대기할 이벤트 이름
 * @param timeoutMs - 타임아웃 (기본 3초)
 */
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

  // 테스트: 채팅방 입장 + 메시지 전송 흐름
  // 1. 클라이언트가 join 이벤트로 채팅방 입장
  // 2. 서버가 history 이벤트로 기존 메시지 전송
  // 3. 클라이언트가 message 이벤트로 메시지 전송
  // 4. 서버가 방의 모든 참여자에게 메시지 브로드캐스트
  it("join 시 히스토리를 받고, message가 브로드캐스트된다", async () => {
    // WebSocket 클라이언트 연결
    const client = io(baseUrl, { transports: ["websocket"] });

    await new Promise<void>((resolve) => {
      client.on("connect", () => resolve());
    });

    // 1. 채팅방 입장
    client.emit("join", { userId: "alice", peerId: "bob" });

    // 2. 히스토리 수신 확인
    const history = await waitForEvent<{
      roomId: string;
      messages: unknown[];
    }>(client, "history");

    expect(history.roomId).toBe("alice_bob");
    expect(history.messages).toHaveLength(0);

    // 3. 메시지 전송
    client.emit("message", {
      userId: "alice",
      peerId: "bob",
      content: "hello",
    });

    // 4. 브로드캐스트된 메시지 수신 확인
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
