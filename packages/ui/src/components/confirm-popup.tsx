"use client";

import type { ReactNode } from "react";
import { Popup } from "./popup";
import { Stack } from "./stack";
import { Text } from "./text";
import { Button } from "./button";

export interface ConfirmPopupProps {
  open?: boolean;
  title?: ReactNode;
  message?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** 위험한 동작(삭제 등)이면 confirm 버튼을 danger 색으로 강조 */
  danger?: boolean;
  onConfirm?: () => void;
  onClose?: () => void;
}

/**
 * "정말 삭제하시겠습니까?" 같은 되돌리기 어려운 동작을 실행 전에 한 번 더 확인받는 공용 팝업.
 * X 버튼(IconX)으로 삭제 같은 동작을 누를 때 특히 많이 쓴다 — 즉시 실행하지 않고 이 팝업을
 * 거치게 해서 실수로 지우는 걸 막는다.
 */
export function ConfirmPopup({
  open,
  title = "정말 삭제하시겠습니까?",
  message,
  confirmLabel = "삭제",
  cancelLabel = "취소",
  danger = true,
  onConfirm,
  onClose,
}: ConfirmPopupProps) {
  return (
    <Popup open={open} onClose={onClose} title={title}>
      <Stack direction="column" gap="md">
        {message && <Text variant="sub">{message}</Text>}
        <Stack gap="sm">
          <Button variant="outline" fullWidth onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button variant={danger ? "danger" : "primary"} fullWidth onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </Stack>
      </Stack>
    </Popup>
  );
}
