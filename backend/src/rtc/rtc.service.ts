import { Injectable } from "@nestjs/common";

@Injectable()
export class RtcService {
  private readonly readyMap = new Map<string, Set<string>>();

  markReady(roomId: string, clientId: string): number {
    const readySet = this.readyMap.get(roomId) ?? new Set<string>();
    readySet.add(clientId);
    this.readyMap.set(roomId, readySet);
    return readySet.size;
  }

  clearReady(roomId: string, clientId: string): void {
    const readySet = this.readyMap.get(roomId);
    if (!readySet) {
      return;
    }

    readySet.delete(clientId);
    if (readySet.size === 0) {
      this.readyMap.delete(roomId);
    }
  }

  clearRoom(roomId: string): void {
    this.readyMap.delete(roomId);
  }
}
