import { Button } from "@chinguya/ui/button";
import { StatusBadge } from "@chinguya/ui/badge";

export default function Page() {
  return (
    <main className="mx-auto max-w-2xl p-6">
      <p className="text-sm text-muted">친구야 · 고객 · 모바일</p>
      <h1 className="mt-1 text-2xl font-bold">고객 페이지</h1>
      <p className="mt-4 text-muted">
        모노레포 스캐폴드. 공용 패키지(@chinguya/ui, types, api-client)가 연결되어 있습니다.
      </p>
      <div className="mt-6 flex items-center gap-3">
        <Button>예약</Button>
        <Button variant="ghost">취소</Button>
        <StatusBadge status="completed" />
      </div>
    </main>
  );
}
