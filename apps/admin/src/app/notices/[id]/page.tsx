"use client";

import { useParams } from "next/navigation";
import { NoticeForm } from "@/components/NoticeForm";

/** 공지사항·이벤트 글 수정(S4-A4-M1). 폼은 등록 화면과 같은 컴포넌트를 쓴다. */
export default function AdminNoticeEditPage() {
  const params = useParams<{ id: string }>();
  return <NoticeForm noticeId={params.id} />;
}
