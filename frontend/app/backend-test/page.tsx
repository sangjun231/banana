"use client";

import { useEffect, useState } from "react";

interface HealthResponse {
  status: string;
  message: string;
  timestamp: string;
}

export default function BackendTestPage() {
  const [healthData, setHealthData] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("http://localhost:3001/health");

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: HealthResponse = await response.json();
        setHealthData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchHealth();
  }, []);

  const handleRefresh = () => {
    setLoading(true);
    setError(null);
    fetch("http://localhost:3001/health")
      .then((res) => res.json())
      .then((data: HealthResponse) => {
        setHealthData(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="mb-6 font-bold text-3xl">Backend 연결 테스트</h1>

      <div className="max-w-2xl rounded-lg bg-white p-6 shadow">
        <div className="mb-4">
          <h2 className="mb-2 font-semibold text-xl">NestJS 서버 상태</h2>
          <p className="mb-4 text-gray-600">
            서버 URL:{" "}
            <code className="rounded bg-gray-100 px-2 py-1">
              http://localhost:3001/health
            </code>
          </p>
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-blue-600">
            <div className="h-4 w-4 animate-spin rounded-full border-blue-600 border-b-2"></div>
            <span>연결 중...</span>
          </div>
        )}

        {error && (
          <div className="mb-4 rounded border border-red-200 bg-red-50 p-4">
            <p className="font-semibold text-red-800">❌ 연결 실패</p>
            <p className="mt-2 text-red-600">{error}</p>
            <p className="mt-2 text-red-500 text-sm">
              NestJS 서버가 실행 중인지 확인하세요:{" "}
              <code>pnpm dev:backend</code>
            </p>
          </div>
        )}

        {healthData && !loading && (
          <div className="mb-4 rounded border border-green-200 bg-green-50 p-4">
            <p className="mb-2 font-semibold text-green-800">✅ 연결 성공!</p>
            <div className="mt-2 rounded bg-white p-4">
              <pre className="overflow-auto text-sm">
                {JSON.stringify(healthData, null, 2)}
              </pre>
            </div>
            <div className="mt-4 text-gray-600 text-sm">
              <p>
                <strong>Status:</strong> {healthData.status}
              </p>
              <p>
                <strong>Message:</strong> {healthData.message}
              </p>
              <p>
                <strong>Timestamp:</strong>{" "}
                {new Date(healthData.timestamp).toLocaleString("ko-KR")}
              </p>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={handleRefresh}
          disabled={loading}
          className="mt-4 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
        >
          새로고침
        </button>
      </div>

      <div className="mt-6 max-w-2xl rounded-lg bg-gray-50 p-4">
        <h3 className="mb-2 font-semibold">다음 단계</h3>
        <ul className="list-inside list-disc space-y-1 text-gray-700">
          <li>✅ NestJS 서버 실행 확인</li>
          <li>✅ Next.js에서 API 호출 성공</li>
          <li>다음: WebSocket 기능 추가</li>
          <li>다음: AWS 배포 준비</li>
        </ul>
      </div>
    </div>
  );
}
