"use client";

import { useMemo, useState } from "react";
import { Title } from "@chinguya/ui/title";
import { Text } from "@chinguya/ui/text";
import { EmptyState } from "@chinguya/ui/empty-state";
import { Card } from "@chinguya/ui/card";
import { Stack } from "@chinguya/ui/stack";
import { Badge } from "@chinguya/ui/badge";
import { Button } from "@chinguya/ui/button";
import { Popup } from "@chinguya/ui/popup";
import { ConfirmPopup } from "@chinguya/ui/confirm-popup";
import { LabeledBox } from "@chinguya/ui/labeled-box";
import { Input } from "@chinguya/ui/input";
import { Toast } from "@chinguya/ui/toast";
import {
  listActiveAssets,
  listDeletedAssets,
  isNameTaken,
  addAsset,
  updateAssetName,
  deleteAsset,
  restoreAsset,
} from "@/data/assetData";
import { hasInventoryRecords } from "@/data/inventoryData";

/**
 * 자산 관리(S1-A2) — 명칭 마스터 · 모달 CRUD.
 * 자산의 "명칭"만 등록·수정·삭제·복원한다(카테고리는 다루지 않는다). 실제 보유 수량(기준
 * 보유량)과 날짜별 재고 조정은 이 화면이 아니라 날짜별 재고 현황(S1-A3, /inventory)에서
 * 관리한다 — 비동기 데일리 로그(2026-09-03, "S1-A2 자산관리 기획 수정")에 따라 등록/수정/
 * 삭제/복원을 전부 별도 화면 없이 모달로 처리하도록 다시 만들었다.
 *
 * 삭제 규칙: 이 자산을 참조하는 재고 레코드가 0건이면 완전 삭제, 1건 이상이면 소프트삭제
 * (하단 "삭제됨" 섹션에 남고 복원 가능) — assetData.deleteAsset이 판단한다.
 */
export default function AdminAssetsPage() {
  const [refreshTick, setRefreshTick] = useState(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const activeAssets = useMemo(() => listActiveAssets(), [refreshTick]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const deletedAssets = useMemo(() => listDeletedAssets(), [refreshTick]);

  const [registerOpen, setRegisterOpen] = useState(false);
  const [registerName, setRegisterName] = useState("");
  const [registerError, setRegisterError] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editOriginalName, setEditOriginalName] = useState("");
  const [editError, setEditError] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const [restoreTarget, setRestoreTarget] = useState<string | null>(null);
  const [restoreName, setRestoreName] = useState("");
  const [restoreError, setRestoreError] = useState("");

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const openRegister = () => {
    setRegisterName("");
    setRegisterError("");
    setRegisterOpen(true);
  };

  const handleRegister = () => {
    const trimmed = registerName.trim();
    if (!trimmed) {
      setRegisterError("자산 명칭을 입력해주세요.");
      return;
    }
    if (isNameTaken(trimmed)) {
      setRegisterError("이미 사용 중인 자산 명칭입니다.");
      return;
    }
    addAsset(trimmed);
    setRefreshTick((t) => t + 1);
    setRegisterOpen(false);
    setToastMessage("자산이 등록되었습니다");
  };

  const openEdit = (id: string) => {
    const asset = activeAssets.find((a) => a.id === id);
    if (!asset) return;
    setEditingId(id);
    setEditName(asset.name);
    setEditOriginalName(asset.name);
    setEditError("");
    setEditOpen(true);
  };

  const isEditUnchanged = editName.trim() === editOriginalName.trim();

  const handleSaveEdit = () => {
    if (!editingId) return;
    const trimmed = editName.trim();
    if (!trimmed) {
      setEditError("자산 명칭을 입력해주세요.");
      return;
    }
    if (isNameTaken(trimmed, editingId)) {
      setEditError("이미 사용 중인 자산 명칭입니다.");
      return;
    }
    updateAssetName(editingId, trimmed);
    setRefreshTick((t) => t + 1);
    setEditOpen(false);
    setToastMessage("자산이 수정되었습니다");
  };

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      const willSoftDelete = hasInventoryRecords(deleteTarget);
      deleteAsset(deleteTarget);
      setRefreshTick((t) => t + 1);
      setToastMessage(willSoftDelete ? "삭제됨으로 처리되었습니다" : "자산이 완전히 삭제되었습니다");
    }
    setDeleteTarget(null);
  };

  const openRestore = (id: string) => {
    const asset = deletedAssets.find((a) => a.id === id);
    if (!asset) return;
    setRestoreTarget(id);
    setRestoreName(asset.name);
    setRestoreError("");
  };

  const handleConfirmRestore = () => {
    if (!restoreTarget) return;
    const trimmed = restoreName.trim();
    if (!trimmed) {
      setRestoreError("자산 명칭을 입력해주세요.");
      return;
    }
    if (isNameTaken(trimmed)) {
      setRestoreError("이미 사용 중인 자산 명칭입니다. 다른 명칭으로 변경해주세요.");
      return;
    }
    restoreAsset(restoreTarget, trimmed);
    setRefreshTick((t) => t + 1);
    setRestoreTarget(null);
    setToastMessage("자산이 복원되었습니다");
  };

  const deleteTargetAsset = activeAssets.find((a) => a.id === deleteTarget);
  const deleteWillSoftDelete = deleteTarget ? hasInventoryRecords(deleteTarget) : false;

  return (
    <main className="mx-auto max-w-2xl p-6">
      <Stack direction="column" gap="sm">
        <Title size="md">자산 관리</Title>
        <Text variant="sub">자산 명칭만 관리합니다. 보유 수량은 날짜별 재고 현황에서 관리합니다.</Text>
      </Stack>

      <Stack justify="between" align="center" className="mt-4">
        <Text weight="bold" leaf>
          활성 자산
        </Text>
        <Button size="sm" onClick={openRegister}>
          + 등록
        </Button>
      </Stack>

      <Stack direction="column" gap="sm" className="mt-2">
        {activeAssets.map((asset) => (
          <Card key={asset.id} padding="sm">
            <Stack justify="between" align="center">
              <Text weight="bold">{asset.name}</Text>
              <Stack gap="xs">
                <Button size="sm" onClick={() => openEdit(asset.id)}>
                  수정
                </Button>
                <Button variant="outline" size="sm" onClick={() => setDeleteTarget(asset.id)}>
                  삭제
                </Button>
              </Stack>
            </Stack>
          </Card>
        ))}
        {activeAssets.length === 0 && <EmptyState>등록된 자산이 없습니다.</EmptyState>}
      </Stack>

      {deletedAssets.length > 0 && (
        <>
          <Text weight="bold" leaf className="mt-6">
            삭제된 자산
          </Text>
          <Stack direction="column" gap="sm" className="mt-2">
            {deletedAssets.map((asset) => (
              <Card key={asset.id} padding="sm" className="opacity-50">
                <Stack justify="between" align="center">
                  <Stack gap="sm" align="start">
                    <Text weight="bold">{asset.name}</Text>
                    <Badge variant="error">삭제됨</Badge>
                  </Stack>
                  <Button variant="outline" size="sm" onClick={() => openRestore(asset.id)}>
                    복원
                  </Button>
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
            <Button fullWidth onClick={handleRegister}>
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
            <Button fullWidth disabled={isEditUnchanged} onClick={handleSaveEdit}>
              저장
            </Button>
          </Stack>
        </Stack>
      </Popup>

      <ConfirmPopup
        open={!!deleteTarget}
        title={deleteWillSoftDelete ? "삭제하시겠습니까?" : "완전히 삭제하시겠습니까?"}
        message={
          deleteTargetAsset ? (
            deleteWillSoftDelete ? (
              <>
                재고 세팅 이력이 있어 목록에 &apos;삭제됨&apos;으로 남습니다. 새 날짜의 재고 세팅은 할 수
                없습니다.
              </>
            ) : (
              <>
                &apos;{deleteTargetAsset.name}&apos;을(를) 삭제합니다. <b>되돌릴 수 없습니다.</b>
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
            <Button fullWidth onClick={handleConfirmRestore}>
              복원
            </Button>
          </Stack>
        </Stack>
      </Popup>

      <Toast open={!!toastMessage} onClose={() => setToastMessage(null)} message={toastMessage ?? ""} />
    </main>
  );
}
