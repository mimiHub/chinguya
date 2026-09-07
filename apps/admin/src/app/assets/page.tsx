"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Title } from "@chinguya/ui/title";
import { Text } from "@chinguya/ui/text";
import { Card } from "@chinguya/ui/card";
import { Stack } from "@chinguya/ui/stack";
import { Badge } from "@chinguya/ui/badge";
import { Button } from "@chinguya/ui/button";
import { Popup } from "@chinguya/ui/popup";
import { ConfirmPopup } from "@chinguya/ui/confirm-popup";
import { LabeledBox } from "@chinguya/ui/labeled-box";
import { Input } from "@chinguya/ui/input";
import { Toast } from "@chinguya/ui/toast";
import { Alert } from "@chinguya/ui/alert";
import { createApiClient, ApiError } from "@chinguya/api-client";
import type { Asset } from "@chinguya/types";
import { useAdminAuth } from "@/context/AdminAuthContext";

/**
 * 자산 관리(S1-A2) — 명칭 마스터 · 모달 CRUD.
 *
 * 자산의 "명칭"만 등록·수정·삭제·복원한다. 실제 보유 수량(기준 보유량)과 날짜별 재고
 * 조정은 이 화면이 아니라 날짜별 재고 세팅(S1-A3, /inventory)에서 관리한다.
 *
 * Core API(GET/POST/PUT/DELETE /admin/assets)에 실연동돼 있다 — 계약은
 * packages/api-spec/openapi/chinguya-admin-api.yaml. 중복 검사·삭제 방식(완전/소프트)·
 * 복원 시 명칭 충돌 판정은 전부 서버가 하고, 이 화면은 서버가 준 문구를 그대로 띄운다.
 *
 * 쓰기는 슈퍼어드민만 가능하다. 아래 버튼 숨김은 서버 403과 정합을 맞추는 것일 뿐
 * 보안 경계가 아니다(경계는 SecurityConfig).
 */

const api = createApiClient();

/** 서버가 준 문구를 그대로 쓰되, 네트워크 오류처럼 본문이 없는 실패는 기본 문구로 대체한다. */
function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) return err.message;
  return fallback;
}

export default function AdminAssetsPage() {
  const { isSuperAdmin } = useAdminAuth();

  const [assets, setAssets] = useState<Asset[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // '삭제됨' 섹션을 그려야 하므로 삭제된 자산까지 받아온다.
  const reload = useCallback(async () => {
    try {
      setAssets(await api.assets.list(true));
      setLoadError(null);
    } catch (err) {
      setLoadError(errorMessage(err, "자산 목록을 불러오지 못했습니다."));
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const activeAssets = useMemo(() => (assets ?? []).filter((a) => !a.deleted), [assets]);
  const deletedAssets = useMemo(() => (assets ?? []).filter((a) => a.deleted), [assets]);

  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [registerOpen, setRegisterOpen] = useState(false);
  const [registerName, setRegisterName] = useState("");
  const [registerError, setRegisterError] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editOriginalName, setEditOriginalName] = useState("");
  const [editError, setEditError] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<Asset | null>(null);

  const [restoreTarget, setRestoreTarget] = useState<Asset | null>(null);
  const [restoreName, setRestoreName] = useState("");
  const [restoreError, setRestoreError] = useState("");

  const openRegister = () => {
    setRegisterName("");
    setRegisterError("");
    setRegisterOpen(true);
  };

  const handleRegister = async () => {
    const trimmed = registerName.trim();
    if (!trimmed) {
      setRegisterError("자산 명칭을 입력해주세요.");
      return;
    }
    setSubmitting(true);
    try {
      await api.assets.create(trimmed);
      await reload();
      setRegisterOpen(false);
      setToastMessage("자산이 등록되었습니다");
    } catch (err) {
      setRegisterError(errorMessage(err, "자산을 등록하지 못했습니다."));
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (asset: Asset) => {
    setEditingId(asset.assetId);
    setEditName(asset.name);
    setEditOriginalName(asset.name);
    setEditError("");
    setEditOpen(true);
  };

  const isEditUnchanged = editName.trim() === editOriginalName.trim();

  const handleSaveEdit = async () => {
    if (!editingId) return;
    const trimmed = editName.trim();
    if (!trimmed) {
      setEditError("자산 명칭을 입력해주세요.");
      return;
    }
    setSubmitting(true);
    try {
      await api.assets.rename(editingId, trimmed);
      await reload();
      setEditOpen(false);
      setToastMessage("자산이 수정되었습니다");
    } catch (err) {
      setEditError(errorMessage(err, "자산을 수정하지 못했습니다."));
    } finally {
      setSubmitting(false);
    }
  };

  // 완전삭제/소프트삭제 판정은 서버가 하므로, 응답의 deletion으로 토스트 문구를 고른다.
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setSubmitting(true);
    try {
      const { deletion } = await api.assets.remove(deleteTarget.assetId);
      await reload();
      setToastMessage(
        deletion === "SOFT" ? "삭제됨으로 처리되었습니다" : "자산이 완전히 삭제되었습니다",
      );
    } catch (err) {
      setToastMessage(errorMessage(err, "자산을 삭제하지 못했습니다."));
    } finally {
      setSubmitting(false);
      setDeleteTarget(null);
    }
  };

  const openRestore = (asset: Asset) => {
    setRestoreTarget(asset);
    setRestoreName(asset.name);
    setRestoreError("");
  };

  const handleConfirmRestore = async () => {
    if (!restoreTarget) return;
    const trimmed = restoreName.trim();
    if (!trimmed) {
      setRestoreError("자산 명칭을 입력해주세요.");
      return;
    }
    setSubmitting(true);
    try {
      await api.assets.restore(restoreTarget.assetId, trimmed);
      await reload();
      setRestoreTarget(null);
      setToastMessage("자산이 복원되었습니다");
    } catch (err) {
      setRestoreError(errorMessage(err, "자산을 복원하지 못했습니다."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto max-w-2xl p-6">
      <Stack direction="column" gap="sm">
        <Title size="md">자산 관리</Title>
        <Text variant="sub">자산 명칭만 관리합니다. 보유 수량은 날짜별 재고 현황에서 관리합니다.</Text>
      </Stack>

      {loadError && (
        <Alert status="error" className="mt-4">
          {loadError}
        </Alert>
      )}

      <Stack justify="between" align="center" className="mt-4">
        <Text weight="bold" leaf>
          활성 자산
        </Text>
        {isSuperAdmin && (
          <Button size="sm" onClick={openRegister}>
            + 등록
          </Button>
        )}
      </Stack>

      <Stack direction="column" gap="sm" className="mt-2">
        {assets === null && !loadError && <Text variant="sub">불러오는 중…</Text>}
        {activeAssets.map((asset) => (
          <Card key={asset.assetId} padding="sm">
            <Stack justify="between" align="center">
              <Text weight="bold">{asset.name}</Text>
              {isSuperAdmin && (
                <Stack gap="xs">
                  <Button size="sm" onClick={() => openEdit(asset)}>
                    수정
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setDeleteTarget(asset)}>
                    삭제
                  </Button>
                </Stack>
              )}
            </Stack>
          </Card>
        ))}
        {assets !== null && activeAssets.length === 0 && <Text variant="sub">등록된 자산이 없습니다.</Text>}
      </Stack>

      {deletedAssets.length > 0 && (
        <>
          <Text weight="bold" leaf className="mt-6">
            삭제된 자산
          </Text>
          <Stack direction="column" gap="sm" className="mt-2">
            {deletedAssets.map((asset) => (
              <Card key={asset.assetId} padding="sm" className="opacity-50">
                <Stack justify="between" align="center">
                  <Stack gap="sm" align="start">
                    <Text weight="bold">{asset.name}</Text>
                    <Badge variant="error">삭제됨</Badge>
                  </Stack>
                  {isSuperAdmin && (
                    <Button variant="outline" size="sm" onClick={() => openRestore(asset)}>
                      복원
                    </Button>
                  )}
                </Stack>
              </Card>
            ))}
          </Stack>
        </>
      )}

      <Popup open={registerOpen} onClose={() => setRegisterOpen(false)} title="자산 등록">
        <Stack direction="column" gap="md">
          <LabeledBox
            label="자산 명칭"
            required
            error={registerError}
            helper="삭제된 명칭은 재사용 가능합니다."
          >
            <Input
              value={registerName}
              onChange={(e) => setRegisterName(e.target.value)}
              placeholder="예) 전기 자전거"
            />
          </LabeledBox>
          <Stack gap="sm">
            <Button variant="outline" fullWidth onClick={() => setRegisterOpen(false)}>
              취소
            </Button>
            <Button fullWidth disabled={submitting} onClick={handleRegister}>
              등록
            </Button>
          </Stack>
        </Stack>
      </Popup>

      <Popup open={editOpen} onClose={() => setEditOpen(false)} title="자산 수정">
        <Stack direction="column" gap="md">
          <LabeledBox
            label="자산 명칭"
            error={editError}
            helper="기존 명칭이 미리 채워집니다. 값을 바꾸지 않으면 저장 버튼이 비활성화됩니다."
          >
            <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
          </LabeledBox>
          <Stack gap="sm">
            <Button variant="outline" fullWidth onClick={() => setEditOpen(false)}>
              취소
            </Button>
            <Button fullWidth disabled={isEditUnchanged || submitting} onClick={handleSaveEdit}>
              저장
            </Button>
          </Stack>
        </Stack>
      </Popup>

      {/* CASE 1(완전 삭제) / CASE 2(소프트 삭제) 문구 분기는 서버가 준 hasInventoryRecords로 정한다. */}
      <ConfirmPopup
        open={!!deleteTarget}
        title={deleteTarget?.hasInventoryRecords ? "삭제하시겠습니까?" : "완전히 삭제하시겠습니까?"}
        message={
          deleteTarget ? (
            deleteTarget.hasInventoryRecords ? (
              <>
                재고 세팅 이력이 있어 목록에 &apos;삭제됨&apos;으로 남습니다. 새 날짜의 재고 세팅은 할 수
                없습니다.
              </>
            ) : (
              <>
                &apos;{deleteTarget.name}&apos;을(를) 삭제합니다. <b>되돌릴 수 없습니다.</b>
              </>
            )
          ) : undefined
        }
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteTarget(null)}
      />

      <Popup open={!!restoreTarget} onClose={() => setRestoreTarget(null)} title="자산 복원">
        <Stack direction="column" gap="md">
          <Text variant="sub">과거 재고·예약 이력을 그대로 이어받습니다.</Text>
          <LabeledBox
            label="자산 명칭"
            error={restoreError}
            helper="같은 명칭의 활성 자산이 이미 있으면 명칭 변경을 요구한 뒤 복원합니다."
          >
            <Input value={restoreName} onChange={(e) => setRestoreName(e.target.value)} />
          </LabeledBox>
          <Stack gap="sm">
            <Button variant="outline" fullWidth onClick={() => setRestoreTarget(null)}>
              취소
            </Button>
            <Button fullWidth disabled={submitting} onClick={handleConfirmRestore}>
              복원
            </Button>
          </Stack>
        </Stack>
      </Popup>

      <Toast open={!!toastMessage} onClose={() => setToastMessage(null)} message={toastMessage ?? ""} />
    </main>
  );
}
