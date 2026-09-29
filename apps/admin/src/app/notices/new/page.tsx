"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { NoticeForm } from "@/components/NoticeForm";

// useSearchParams()는 Suspense 경계 안에 있어야 정적 빌드가 깨지지 않는다.
export default function AdminNoticeNewPage() {
  return (
    <Suspense fallback={null}>
      <AdminNoticeNewPageInner />
    </Suspense>
  );
}

/** 공지사항·이벤트 글 등록(S4-A4-M1). 폼은 수정 화면과 같은 컴포넌트를 쓴다. 카테고리는 목록 탭(`?category=`)을 따른다. */
function AdminNoticeNewPageInner() {
  const category = useSearchParams().get("category");
  return <NoticeForm initialCategory={category === "EVENT" ? "EVENT" : "NOTICE"} />;
}
