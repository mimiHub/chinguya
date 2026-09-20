"use client";

import { useState, type ReactNode } from "react";
import {
  Alert,
  Badge,
  StatusBadge,
  Banner,
  Button,
  Calendar,
  type CalendarDay,
  CalendarIcon,
  Card,
  Checkbox,
  Chip,
  ComingSoon,
  ConfirmPopup,
  Dropdown,
  EmptyState,
  FormMessage,
  HelpTooltip,
  HoldTimer,
  IconHamburger,
  IconX,
  Input,
  Kv,
  LabeledBox,
  Link,
  NoticeBox,
  Popup,
  Radio,
  Section,
  Skeleton,
  Stack,
  Stat,
  StatusIcon,
  Stepper,
  Tab,
  Table,
  Text,
  Title,
  Toast,
  Toggle,
  Tooltip,
} from "@chinguya/ui";

/**
 * 컴포넌트 가이드 (내부 전용).
 *
 * @chinguya/ui의 38개 공통 컴포넌트를 한 화면에서 실제로 렌더링해서 모아 보여준다 —
 * 새 화면을 만들 때 "이미 있는 컴포넌트인지, 어떻게 쓰는지"를 코드를 뒤지지 않고 바로
 * 확인할 수 있게 하는 게 목적이다. 로그인 미들웨어가 이미 이 경로도 보호하므로 별도
 * 접근 제어는 없다. 실제 화면이 아니라 카탈로그라 다른 페이지들(max-w-2xl)보다 넓게
 * (max-w-5xl) 잡았다 — Table·Calendar·Stat 같은 넓은 컴포넌트를 실제 크기로 보여주려면
 * 좁은 폭에서는 잘려 보인다.
 *
 * 상태가 필요한 컴포넌트(Checkbox·Toggle·Stepper·Dropdown·Tab·Popup·ConfirmPopup·Toast·
 * Calendar·Chip·IconHamburger)는 각자 자기 useState를 갖는 별도 Demo 컴포넌트로 뺐다 —
 * 한 페이지에 다 몰아넣더라도 각 데모의 상태가 서로 섞이지 않게.
 *
 * Banner의 기본 이미지(/site-banner.jpg)·Card polaroid의 스티커(/sticker01.png)는 고객앱
 * public에만 있고 admin public에는 없어서, 여기 데모에서는 admin에 실제로 있는 이미지
 * (/bike.png)로 대체했다 — 실제 화면에서 쓸 때는 각 앱의 public에 맞는 이미지를 넣으면 된다.
 */

const GROUPS: { title: string; items: string[] }[] = [
  { title: "레이아웃", items: ["Stack", "Card", "Section", "Title", "Text"] },
  {
    title: "폼 · 입력",
    items: ["Input", "Checkbox", "Radio", "Toggle", "Stepper", "Dropdown", "Chip", "LabeledBox", "Calendar"],
  },
  {
    title: "피드백 · 상태",
    items: ["Alert", "Toast", "Badge", "StatusIcon", "FormMessage", "NoticeBox", "ComingSoon", "EmptyState", "Skeleton"],
  },
  { title: "오버레이", items: ["Popup", "ConfirmPopup", "HelpTooltip", "Tooltip", "HoldTimer"] },
  { title: "네비게이션 · 기타", items: ["Tab", "Link", "IconHamburger", "IconX", "CalendarIcon", "Table", "Kv", "Stat", "Banner", "Button"] },
];

function Demo({ id, name, desc, children }: { id: string; name: string; desc?: string; children: ReactNode }) {
  return (
    <Card>
      <Stack direction="column" gap="sm">
        <div id={id} className="scroll-mt-24">
          <Stack align="center" gap="sm">
            <Text weight="bold" size="lg" as="span">
              {name}
            </Text>
          </Stack>
          {desc && (
            <Text variant="sub" className="mt-1">
              {desc}
            </Text>
          )}
        </div>
        <div className="rounded-md border border-dashed border-line bg-bg-light p-4">{children}</div>
      </Stack>
    </Card>
  );
}

export default function ComponentsGuidePage() {
  return (
    <main className="mx-auto max-w-5xl p-6">
      <Title size="lg" subtitle="@chinguya/ui 공통 컴포넌트 37종 모음">
        컴포넌트 가이드
      </Title>

      {/* 와이어프레임 문서의 상단 인덱스 내비게이션과 같은 패턴 — 그룹별로 묶어서 원하는
          컴포넌트로 바로 스크롤할 수 있게 한다. */}
      <nav className="mt-4 flex flex-col gap-2 rounded-md border border-line bg-surface p-4 text-sm">
        {GROUPS.map((group) => (
          <div key={group.title} className="flex flex-wrap items-baseline gap-2">
            <span className="shrink-0 text-xs font-bold text-muted">{group.title}</span>
            {group.items.map((name) => (
              <a
                key={name}
                href={`#c-${name}`}
                className="rounded-full border border-line px-2.5 py-1 text-xs text-ink hover:border-primary-500 hover:text-primary-500"
              >
                {name}
              </a>
            ))}
          </div>
        ))}
      </nav>

      <Stack direction="column" gap="md" className="mt-6">
        <StackDemo />
        <CardDemo />
        <SectionDemo />
        <TitleDemo />
        <TextDemo />
        <InputDemo />
        <CheckboxDemo />
        <RadioDemo />
        <ToggleDemo />
        <StepperDemo />
        <DropdownDemo />
        <ChipDemo />
        <LabeledBoxDemo />
        <CalendarDemo />
        <AlertDemo />
        <ToastDemo />
        <BadgeDemo />
        <StatusIconDemo />
        <FormMessageDemo />
        <NoticeBoxDemo />
        <ComingSoonDemo />
        <EmptyStateDemo />
        <SkeletonDemo />
        <PopupDemo />
        <ConfirmPopupDemo />
        <HelpTooltipDemo />
        <TooltipDemo />
        <HoldTimerDemo />
        <TabDemo />
        <LinkDemo />
        <IconHamburgerDemo />
        <IconXDemo />
        <CalendarIconDemo />
        <TableDemo />
        <KvDemo />
        <StatDemo />
        <BannerDemo />
        <ButtonDemo />
      </Stack>
    </main>
  );
}

function StackDemo() {
  return (
    <Demo id="c-Stack" name="Stack" desc="direction·gap·align·justify로 flex 레이아웃을 대체하는 기본 컴포넌트">
      <Stack direction="column" gap="sm">
        <Text variant="sub">direction=&quot;row&quot; gap=&quot;sm&quot;</Text>
        <Stack gap="sm">
          <Badge variant="primary">A</Badge>
          <Badge variant="secondary">B</Badge>
          <Badge variant="success">C</Badge>
        </Stack>
        <Text variant="sub">direction=&quot;column&quot; gap=&quot;xs&quot;</Text>
        <Stack direction="column" gap="xs">
          <Badge variant="gray">1행</Badge>
          <Badge variant="gray">2행</Badge>
        </Stack>
      </Stack>
    </Demo>
  );
}

function CardDemo() {
  return (
    <Demo id="c-Card" name="Card" desc="테두리·둥근 모서리 기본 컨테이너. tint·padding·width·shadow 옵션">
      <Stack gap="sm" wrap>
        <Card padding="sm" width="sm">
          <Text>기본</Text>
        </Card>
        <Card padding="sm" width="sm" tint="primary">
          <Text>tint=&quot;primary&quot;</Text>
        </Card>
        <Card padding="sm" width="sm" tint="secondary">
          <Text>tint=&quot;secondary&quot;</Text>
        </Card>
        <Card padding="sm" width="sm" shadow={false}>
          <Text>shadow=false</Text>
        </Card>
      </Stack>
    </Demo>
  );
}

function SectionDemo() {
  return (
    <Demo id="c-Section" name="Section" desc="스크롤 진입 시 한 번 페이드인되는 페이지 콘텐츠 래퍼">
      <Section>
        <Text>이 박스를 스크롤로 다시 지나치면 처음 진입할 때만 페이드/슬라이드 애니메이션이 보인다.</Text>
      </Section>
    </Demo>
  );
}

function TitleDemo() {
  return (
    <Demo id="c-Title" name="Title" desc="페이지·섹션 제목. size·subtitle·action·divider·leaf 옵션">
      <Stack direction="column" gap="md">
        <Title size="md" subtitle="부제목 예시">
          기본 제목
        </Title>
        <Title size="sm" action={<Button size="sm">액션</Button>} divider>
          우측 액션 + 구분선
        </Title>
        <Title size="sm" leaf>
          leaf 아이콘 포함
        </Title>
      </Stack>
    </Demo>
  );
}

function TextDemo() {
  return (
    <Demo id="c-Text" name="Text" desc="본문 텍스트. variant·weight·size·tone·leaf 옵션">
      <Stack direction="column" gap="xs">
        <Text variant="lg" weight="bold">
          variant=&quot;lg&quot; weight=&quot;bold&quot;
        </Text>
        <Text variant="body">variant=&quot;body&quot; (기본)</Text>
        <Text variant="sub">variant=&quot;sub&quot;</Text>
        <Text variant="caption" tone="error">
          variant=&quot;caption&quot; tone=&quot;error&quot;
        </Text>
        <Text leaf>leaf 아이콘 포함</Text>
      </Stack>
    </Demo>
  );
}

function InputDemo() {
  const [value, setValue] = useState("");
  return (
    <Demo id="c-Input" name="Input" desc="size·error·as(textarea)·type=&quot;switch&quot; 옵션을 갖는 텍스트 입력">
      <Stack direction="column" gap="sm">
        <Input placeholder="기본 입력" value={value} onChange={(e) => setValue(e.target.value)} />
        <Input placeholder="error 상태" error />
        <Input as="textarea" placeholder="textarea" rows={3} />
        <Input type="switch" />
      </Stack>
    </Demo>
  );
}

function CheckboxDemo() {
  const [checked, setChecked] = useState(true);
  return (
    <Demo id="c-Checkbox" name="Checkbox" desc="controlled 전용 — checked·onChange 필수">
      <Stack gap="sm" align="center">
        <Checkbox checked={checked} onChange={setChecked} />
        <Text variant="sub">{checked ? "선택됨" : "선택 안 됨"}</Text>
      </Stack>
    </Demo>
  );
}

function RadioDemo() {
  const [value, setValue] = useState<"a" | "b" | "c">("a");
  const options: { key: "a" | "b" | "c"; label: string }[] = [
    { key: "a", label: "옵션 A" },
    { key: "b", label: "옵션 B" },
    { key: "c", label: "옵션 C" },
  ];
  return (
    <Demo id="c-Radio" name="Radio" desc="controlled 전용 — 같은 name으로 묶어서 단일 선택 그룹으로 쓴다">
      <Stack gap="md" align="center">
        {options.map((opt) => (
          <label key={opt.key} className="flex cursor-pointer items-center gap-1.5">
            <Radio name="radio-demo" checked={value === opt.key} onChange={() => setValue(opt.key)} />
            <Text variant="sub">{opt.label}</Text>
          </label>
        ))}
      </Stack>
    </Demo>
  );
}

function ToggleDemo() {
  const [on, setOn] = useState(false);
  return (
    <Demo
      id="c-Toggle"
      name="Toggle"
      desc="관리자 노출 여부 등에 쓰는 on/off 스위치 — label을 주면 텍스트를 클릭해도 함께 토글된다"
    >
      <Stack direction="column" gap="md">
        <Toggle on={on} onChange={setOn} label="공개로 등록" />
        <Stack gap="sm" align="center">
          <Toggle on={on} onChange={setOn} />
          <Text variant="sub">label 없이 스위치만(기존 방식) — {on ? "ON" : "OFF"}</Text>
        </Stack>
      </Stack>
    </Demo>
  );
}

function StepperDemo() {
  const [value, setValue] = useState(1);
  return (
    <Demo id="c-Stepper" name="Stepper" desc="controlled 수량 +/- 스테퍼. min·max 지원">
      <Stepper value={value} min={0} max={5} onChange={setValue} />
    </Demo>
  );
}

function DropdownDemo() {
  const [value, setValue] = useState<string | null>(null);
  return (
    <Demo id="c-Dropdown" name="Dropdown" desc="네이티브 select 대신 쓰는 커스텀 드롭다운">
      <Dropdown
        className="max-w-xs"
        value={value}
        onChange={setValue}
        placeholder="여행사 선택"
        options={[
          { value: "a", label: "제주바다여행사" },
          { value: "b", label: "한라산여행사" },
          { value: "c", label: "성산일출여행사" },
        ]}
      />
    </Demo>
  );
}

function ChipDemo() {
  const [selected, setSelected] = useState("1일");
  const options = ["1일", "2일", "3일"];
  return (
    <Demo id="c-Chip" name="Chip" desc="Chip.List로 감싼 가로 스크롤 토글 칩 목록(대여 기간 등 옵션 선택)">
      <Chip.List>
        {options.map((opt) => (
          <Chip key={opt} on={selected === opt} onClick={() => setSelected(opt)}>
            {opt}
          </Chip>
        ))}
      </Chip.List>
    </Demo>
  );
}

function LabeledBoxDemo() {
  return (
    <Demo id="c-LabeledBox" name="LabeledBox" desc="라벨 + 입력 + helper/error를 묶는 폼 필드 래퍼">
      <Stack direction="column" gap="sm">
        <LabeledBox label="아이디" required>
          <Input placeholder="agency01" />
        </LabeledBox>
        <LabeledBox label="비밀번호" required error="비밀번호가 일치하지 않습니다">
          <Input type="password" error />
        </LabeledBox>
        <LabeledBox label="메모" helper="선택 입력입니다">
          <Input as="textarea" rows={2} />
        </LabeledBox>
      </Stack>
    </Demo>
  );
}

function buildDemoDays(year: number, month: number): CalendarDay[] {
  const firstWeekday = new Date(year, month - 1, 1).getDay();
  const lastDate = new Date(year, month, 0).getDate();
  const statuses: CalendarDay["status"][] = ["ok", "low", "zero", "holiday"];
  const days: CalendarDay[] = [];
  for (let i = 0; i < firstWeekday; i++) days.push({ date: "", status: "off" });
  for (let d = 1; d <= lastDate; d++) {
    days.push({ date: d, status: statuses[d % statuses.length], qty: 5, remaining: d % 5 });
  }
  return days;
}

function CalendarDemo() {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [selected, setSelected] = useState<number | undefined>(today.getDate());
  return (
    <Demo id="c-Calendar" name="Calendar" desc="예약 가능일 등을 보여주는 달력. days 배열·월 이동은 호출부가 소유">
      <Card padding="sm" width="sm">
        <Calendar
          year={today.getFullYear()}
          month={month}
          days={buildDemoDays(today.getFullYear(), month)}
          selected={selected}
          onSelect={setSelected}
          onPrevMonth={() => setMonth((m) => Math.max(1, m - 1))}
          onNextMonth={() => setMonth((m) => Math.min(12, m + 1))}
        />
      </Card>
    </Demo>
  );
}

function AlertDemo() {
  return (
    <Demo id="c-Alert" name="Alert" desc="status별 인라인 안내 박스. tone=&quot;dark&quot;는 항상 보이는 대시보드 배너용">
      <Stack direction="column" gap="sm">
        <Alert status="success" title="예약이 완료되었습니다">
          입금 확인 후 자동으로 상태가 바뀝니다.
        </Alert>
        <Alert status="warning" title="마감 임박">
          취소 가능 기한이 오늘까지입니다.
        </Alert>
        <Alert status="error" title="처리 실패">
          잠시 후 다시 시도해주세요.
        </Alert>
        <Alert status="info" tone="dark">
          tone=&quot;dark&quot; — 어두운 배경 버전
        </Alert>
      </Stack>
    </Demo>
  );
}

function ToastDemo() {
  const [open, setOpen] = useState(false);
  return (
    <Demo id="c-Toast" name="Toast" desc="하단 고정 토스트. open 상태를 호출부가 들고 있어야 함">
      <Button size="sm" onClick={() => setOpen(true)}>
        토스트 띄우기
      </Button>
      <Toast open={open} onClose={() => setOpen(false)} message="저장되었습니다" status="success" />
    </Demo>
  );
}

function BadgeDemo() {
  return (
    <Demo id="c-Badge" name="Badge / StatusBadge" desc="일반 Badge와, 고객 예약 4상태 전용 StatusBadge">
      <Stack direction="column" gap="sm">
        <Stack gap="sm" wrap>
          <Badge variant="primary">primary</Badge>
          <Badge variant="secondary">secondary</Badge>
          <Badge variant="success">success</Badge>
          <Badge variant="warning">warning</Badge>
          <Badge variant="error">error</Badge>
          <Badge variant="info">info</Badge>
          <Badge variant="gray">gray</Badge>
        </Stack>
        <Stack gap="sm" wrap>
          <StatusBadge status="received" />
          <StatusBadge status="completed" />
          <StatusBadge status="cancel_requested" />
          <StatusBadge status="cancelled" />
        </Stack>
      </Stack>
    </Demo>
  );
}

function StatusIconDemo() {
  return (
    <Demo id="c-StatusIcon" name="StatusIcon" desc="Alert·Toast 내부에서 쓰는 상태별 원형 아이콘">
      <Stack gap="md">
        <StatusIcon status="success" />
        <StatusIcon status="warning" />
        <StatusIcon status="error" />
        <StatusIcon status="info" />
      </Stack>
    </Demo>
  );
}

function FormMessageDemo() {
  return (
    <Demo id="c-FormMessage" name="FormMessage" desc="폼 필드 하단 메시지(LabeledBox 내부에서 주로 쓰임)">
      <Stack direction="column" gap="xs">
        <FormMessage type="helper">도움말 메시지</FormMessage>
        <FormMessage type="error">에러 메시지</FormMessage>
        <FormMessage type="success">성공 메시지</FormMessage>
        <FormMessage type="warning">경고 메시지</FormMessage>
        <FormMessage type="info">안내 메시지</FormMessage>
      </Stack>
    </Demo>
  );
}

function NoticeBoxDemo() {
  return (
    <Demo id="c-NoticeBox" name="NoticeBox" desc="관리자 답변·FAQ 답변 등에 쓰는 배경 박스">
      <Stack direction="column" gap="sm">
        <NoticeBox title="관리자 답변" tone="gray">
          문의 주신 건 확인 후 안내드리겠습니다.
        </NoticeBox>
        <NoticeBox tone="warning">tone=&quot;warning&quot;</NoticeBox>
      </Stack>
    </Demo>
  );
}

function ComingSoonDemo() {
  return (
    <Demo id="c-ComingSoon" name="ComingSoon" desc="미구현 화면용 플레이스홀더 — default(인라인 안내) / splash(전체 화면 랜딩)">
      <Stack direction="column" gap="sm">
        <Text variant="sub">variant=&quot;default&quot;</Text>
        <ComingSoon label="존재하지 않는 예약입니다" />
        <Text variant="sub">variant=&quot;splash&quot;</Text>
        <div className="overflow-hidden rounded-xl">
          <ComingSoon variant="splash" />
        </div>
        <Text variant="sub">
          variant=&quot;splash&quot; + title/image/label 커스텀 (예: 존재하지 않는 예약 —
          /reservations/[id] 404)
        </Text>
        <div className="overflow-hidden rounded-xl">
          <ComingSoon
            variant="splash"
            image="/reservation-not-found-bg.jpg"
            title="예약을 찾을 수 없어요"
            label={
              <>
                현재 예약이 존재하지 않습니다.
                <br />
                예약번호나 링크를 다시 확인해 주세요.
              </>
            }
          />
        </div>
      </Stack>
    </Demo>
  );
}

function EmptyStateDemo() {
  return (
    <Demo id="c-EmptyState" name="EmptyState" desc="표·목록에 데이터가 없을 때">
      <EmptyState>표시할 데이터가 없습니다</EmptyState>
    </Demo>
  );
}

function SkeletonDemo() {
  return (
    <Demo id="c-Skeleton" name="Skeleton" desc="로딩 중 표시하는 셰이머 플레이스홀더. variant별 모양">
      <Stack direction="column" gap="sm">
        <Skeleton variant="title" />
        <Skeleton variant="text" count={2} />
        <Skeleton variant="image" height={80} />
        <Skeleton variant="list" count={2} />
      </Stack>
    </Demo>
  );
}

function PopupDemo() {
  const [open, setOpen] = useState(false);
  return (
    <Demo id="c-Popup" name="Popup" desc="모바일은 바텀시트, md 이상은 중앙 모달로 뜨는 범용 팝업">
      <Button size="sm" onClick={() => setOpen(true)}>
        팝업 열기
      </Button>
      <Popup open={open} onClose={() => setOpen(false)} title="팝업 제목">
        <Text>팝업 내용 영역입니다.</Text>
      </Popup>
    </Demo>
  );
}

function ConfirmPopupDemo() {
  const [open, setOpen] = useState(false);
  return (
    <Demo id="c-ConfirmPopup" name="ConfirmPopup" desc="삭제 등 되돌릴 수 없는 동작 확인용 Popup 래퍼">
      <Button size="sm" variant="danger" onClick={() => setOpen(true)}>
        삭제
      </Button>
      <ConfirmPopup
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={() => setOpen(false)}
        message="이 작업은 되돌릴 수 없습니다."
      />
    </Demo>
  );
}

function HelpTooltipDemo() {
  return (
    <Demo id="c-HelpTooltip" name="HelpTooltip" desc="클릭으로 여닫는 도움말 팝오버(여러 줄 가능)">
      <HelpTooltip>취소 수수료는 이용일 기준으로 계산됩니다.</HelpTooltip>
    </Demo>
  );
}

function TooltipDemo() {
  return (
    <Demo id="c-Tooltip" name="Tooltip" desc="hover/focus 전용 한 줄 툴팁 — 트리거 요소 하나를 감싼다">
      <Tooltip label="한 줄 설명 텍스트">
        <Button size="sm" variant="outline">
          마우스를 올려보세요
        </Button>
      </Tooltip>
    </Demo>
  );
}

function HoldTimerDemo() {
  return (
    <Demo id="c-HoldTimer" name="HoldTimer" desc="남은 홀드 시간 표시(카운트다운 로직은 호출부 책임)">
      <HoldTimer seconds={125} />
    </Demo>
  );
}

function TabDemo() {
  const items = [
    { key: "a", label: "탭A" },
    { key: "b", label: "탭B" },
    { key: "c", label: "탭C" },
  ];
  const [underline, setUnderline] = useState("a");
  const [capsule, setCapsule] = useState("a");
  const [segment, setSegment] = useState("a");
  return (
    <Demo id="c-Tab" name="Tab" desc="controlled 탭. variant=&quot;underline&quot;|&quot;capsule&quot;|&quot;segment&quot;">
      <Stack direction="column" gap="md">
        <Tab items={items} activeKey={underline} onChange={setUnderline} variant="underline" />
        <Tab items={items} activeKey={capsule} onChange={setCapsule} variant="capsule" />
        <Tab items={items} activeKey={segment} onChange={setSegment} variant="segment" />
      </Stack>
    </Demo>
  );
}

function LinkDemo() {
  return (
    <Demo id="c-Link" name="Link" desc="next/link 래퍼. variant·underline·size 옵션 + Link.Button">
      <Stack gap="md" align="center" wrap>
        <Link href="#c-Link">기본 링크</Link>
        <Link href="#c-Link" variant="muted" underline="always">
          muted, underline=&quot;always&quot;
        </Link>
        <Link href="#c-Link" variant="danger">
          danger
        </Link>
        <Link.Button href="#c-Link">Link.Button</Link.Button>
      </Stack>
    </Demo>
  );
}

function IconHamburgerDemo() {
  const [open, setOpen] = useState(false);
  return (
    <Demo id="c-IconHamburger" name="IconHamburger" desc="열림 상태에 따라 X 모양으로 바뀌는 토글 버튼">
      <IconHamburger open={open} onClick={() => setOpen((v) => !v)} />
    </Demo>
  );
}

function IconXDemo() {
  return (
    <Demo id="c-IconX" name="IconX" desc="삭제/닫기용 X 아이콘 버튼. size xs~lg">
      <Stack gap="sm" align="center">
        <IconX size="xs" />
        <IconX size="sm" />
        <IconX size="md" />
        <IconX size="lg" />
      </Stack>
    </Demo>
  );
}

function CalendarIconDemo() {
  return (
    <Demo id="c-CalendarIcon" name="CalendarIcon" desc="날짜 선택 트리거 등에 쓰는 순수 SVG 달력 아이콘">
      <CalendarIcon className="h-6 w-6 text-ink" />
    </Demo>
  );
}

function TableDemo() {
  return (
    <Demo id="c-Table" name="Table" desc="columns·rows 데이터로 그리는 표. rows가 비면 emptyMessage 표시">
      <Table
        columns={[
          { key: "no", label: "예약번호", width: "120px" },
          { key: "product", label: "상품" },
          { key: "status", label: "상태", align: "right" },
        ]}
        rows={[
          { no: "AG-27070011", product: "전기자전거 · 1일", status: <StatusBadge status="completed" /> },
          { no: "AG-27070012", product: "일반자전거 · 1일", status: <StatusBadge status="received" /> },
        ]}
      />
    </Demo>
  );
}

function KvDemo() {
  return (
    <Demo id="c-Kv" name="Kv" desc="예약/주문 요약 등에 쓰는 key-value 목록">
      <Kv
        items={[
          { key: "예약번호", value: "AG-27070011" },
          { key: "상품", value: "전기자전거 · 1일" },
          { key: "금액", value: "45,000원", tone: "accent" },
        ]}
      />
    </Demo>
  );
}

function StatDemo() {
  return (
    <Demo id="c-Stat" name="Stat" desc="관리자 대시보드 숫자 카드 그리드. tone으로 숫자·라벨 색 구분, large는 왼쪽 큰 카드">
      <Stat
        items={[
          { value: 4, label: "신규 예약", tone: "primary", large: true },
          { value: "2건", label: "미입금", tone: "warning" },
          { value: 1, label: "취소요청", tone: "error" },
        ]}
      />
    </Demo>
  );
}

function BannerDemo() {
  return (
    <Demo id="c-Banner" name="Banner" desc="상단 배경 이미지 배너. size=&quot;lg&quot;|&quot;sm&quot;">
      <Banner size="sm" title="배너 제목 예시" image="/bike.png" />
    </Demo>
  );
}

function ButtonDemo() {
  return (
    <Demo
      id="c-Button"
      name="Button"
      desc="variant 7종 · size 3종 · href를 주면 next/link로 렌더 · disabled/loading"
    >
      <Stack gap="sm" wrap>
        <Button variant="primary">primary</Button>
        <Button variant="secondary">secondary</Button>
        <Button variant="outline">outline</Button>
        <Button variant="text">text</Button>
        <Button variant="danger">danger</Button>
        <Button variant="ghost">ghost</Button>
        <Button variant="subtle">subtle</Button>
      </Stack>
      {/* disabled/loading — 저장 중일 때 disabled={saving} + "저장 중…" 텍스트 교체를 매번
          손으로 반복하던 걸 loading/loadingText prop 두 개로 합쳤다(2026-09). */}
      <Stack gap="sm" wrap className="mt-3">
        <Button disabled>disabled</Button>
        <Button loading loadingText="저장 중…">
          저장
        </Button>
        <Button variant="outline" loading>
          로딩만(loadingText 없음)
        </Button>
      </Stack>
    </Demo>
  );
}
