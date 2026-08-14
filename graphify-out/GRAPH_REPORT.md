# Graph Report - .  (2026-08-13)

## Corpus Check
- 125 files · ~486,445 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 909 nodes · 1384 edges · 76 communities (54 shown, 22 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 14 edges (avg confidence: 0.77)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Admin Product Editing
- Admin Allocation & Invoicing Data
- Customer App Package Manifest
- Admin App Package Manifest
- Agency App Package Manifest
- Admin Dashboard & Reservation Actions
- App Root Layout & Bottom Nav
- UI Package Exports
- Admin Products & Calendar UI
- Admin Agency Management
- TypeScript Config Package Manifest
- Admin Accounts & Agency Onboarding
- Root Workspace Manifest
- API Client Package Manifest
- Types Package Manifest
- Base TS Config
- Monorepo Structure & Core Business Rules
- Admin Asset Management
- Admin More Menu & Stack Layout
- Customer Next.js TS Config
- Admin Next.js TS Config
- Agency Next.js TS Config
- Landing & Product Browsing Screens
- Next.js Shared TS Config Preset
- Cancellation Fee & Reservation List Screens
- Booking Calendar & Agency Onboarding Screens
- Shared ESLint Configs
- Button Component
- Payment Policy & Admin Reservation Screens
- React Library TS Config Preset
- Wireframes Package Manifest
- Shared Dev Dependencies
- Link Component
- Base TS Config Preset
- Text Component
- Admin Settings Data
- Next/React Peer Dependencies
- Top-level Docs & Screen-Code Convention
- FAQ & Inquiry Screens
- TypeScript Config Package Files
- Input Component
- Title Component
- Invoice Policy Screens
- Passport Name Policy & Cart/Deposit Screens
- Types Package TS Config
- UI Package TS Config
- Agency Management Screens
- Tailwind Config Package
- Admin Permission Tier Screens
- Inventory Formula Screens
- Dual Pricing Screens
- Skeleton Component
- Table Component
- Hold Timer Component
- Section Component
- Customer Next.js Config
- Customer Next Env Types
- Admin Next.js Config
- Admin Next Env Types
- Agency Next.js Config
- Agency Next Env Types
- Admin Asset Management Screens
- Inquiry Management Screens
- Admin Bike Product Image
- Admin E-Bike Product Image
- Admin Fishing Set Product Image
- Agency Bike Product Image
- Agency E-Bike Product Image
- Agency Fishing Set Product Image
- Customer Bike Product Image
- Customer E-Bike Product Image
- Customer Fishing Set Product Image
- Customer App Logo Image

## God Nodes (most connected - your core abstractions)
1. `exports` - 31 edges
2. `Text()` - 21 edges
3. `Title()` - 21 edges
4. `Button()` - 18 edges
5. `Stack()` - 18 edges
6. `packages/types (도메인 타입/비즈니스 규칙 단일 출처)` - 18 edges
7. `compilerOptions` - 14 edges
8. `Card()` - 14 edges
9. `Input()` - 10 edges
10. `scripts` - 9 edges

## Surprising Connections (you probably didn't know these)
- `AdminReservationRow` --references--> `CustomerReservationStatus`  [EXTRACTED]
  apps/admin/src/data/reservationData.ts → packages/types/src/index.ts
- `CLAUDE.md (모노레포 협업 가이드)` --references--> `친구야_페이지정의서.md (페이지 정의서)`  [EXTRACTED]
  CLAUDE.md → chinguya-wireframes/친구야_페이지정의서.md
- `README.md (프로젝트 개요)` --references--> `docs/claude-code-prompt.md (클로드 코드 프롬프트 모음)`  [EXTRACTED]
  README.md → docs/claude-code-prompt.md
- `docs/claude-code-prompt.md (클로드 코드 프롬프트 모음)` --references--> `packages/api-client (타입드 fetch 래퍼)`  [EXTRACTED]
  docs/claude-code-prompt.md → CLAUDE.md
- `docs/claude-code-prompt.md (클로드 코드 프롬프트 모음)` --references--> `packages/types (도메인 타입/비즈니스 규칙 단일 출처)`  [EXTRACTED]
  docs/claude-code-prompt.md → CLAUDE.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **재고 산식 흐름: 자산→재고세팅→할당→여행사가용** — concept_inventory_formula, chinguya_wireframes_page_definition_s1_a2, chinguya_wireframes_page_definition_s1_a3, chinguya_wireframes_page_definition_s2_a4, chinguya_wireframes_page_definition_s2_g4 [INFERRED 0.85]
- **고객 예약 상태 흐름에 참여하는 화면들 (접수→완료→취소요청→취소)** — concept_customer_reservation_states, chinguya_wireframes_page_definition_s1_c4, chinguya_wireframes_page_definition_s1_a8, chinguya_wireframes_page_definition_s1_c7, chinguya_wireframes_page_definition_s1_a9 [EXTRACTED 0.95]
- **packages/types 단일 출처를 소비하는 앱·패키지** — concept_single_source_of_truth_types, package_types, package_ui, package_api_client, app_customer, app_admin, app_agency [EXTRACTED 1.00]

## Communities (76 total, 22 thin omitted)

### Community 0 - "Admin Product Editing"
Cohesion: 0.06
Nodes (45): AdminProductEditPage(), TODO: 실제 연동 시 여기서 POST(신규)/PATCH(수정) 호출 후 성공하면 목록으로 이동한다., AdminProductVariant, adminProductVariants, buildVariants(), CATALOG_TITLES, CATEGORY_LABEL, findAdminProductVariantById() (+37 more)

### Community 1 - "Admin Allocation & Invoicing Data"
Cohesion: 0.07
Nodes (34): AdminAllocationsPage(), AdminInventoryPage(), AdminInvoicesPage(), getAllocatedQty(), getTotalAllocatedQty(), mapKey(), mockAllocations, saveAllocatedQty() (+26 more)

### Community 2 - "Customer App Package Manifest"
Cohesion: 0.04
Nodes (44): dependencies, @chinguya/api-client, @chinguya/types, @chinguya/ui, next, react, react-dom, devDependencies (+36 more)

### Community 3 - "Admin App Package Manifest"
Cohesion: 0.04
Nodes (44): dependencies, @chinguya/api-client, @chinguya/types, @chinguya/ui, next, react, react-dom, devDependencies (+36 more)

### Community 4 - "Agency App Package Manifest"
Cohesion: 0.04
Nodes (44): dependencies, @chinguya/api-client, @chinguya/types, @chinguya/ui, next, react, react-dom, devDependencies (+36 more)

### Community 5 - "Admin Dashboard & Reservation Actions"
Cohesion: 0.09
Nodes (26): AdminDashboardPage(), AdminReservationDetailPage(), TODO: 실제 연동 시 POST /api/admin/reservations/{id}/confirm-deposit 호출로 교체, TODO: 실제 연동 시 POST /api/admin/reservations/{id}/force-cancel 호출로 교체. 재고 즉시 복원., TODO: 실제 연동 시 환불 이체 확인 후 POST /api/admin/reservations/{id}/confirm-cancel. 재고 즉시, AdminReservationsPage(), TABS, ADMIN_TAB_LABEL (+18 more)

### Community 6 - "App Root Layout & Bottom Nav"
Cohesion: 0.07
Nodes (23): metadata, BottomNav(), ITEMS, metadata, metadata, ^build, dist/**, ^lint (+15 more)

### Community 7 - "UI Package Exports"
Cohesion: 0.06
Nodes (31): exports, ./badge, ./button, ./calendar, ./calendar-icon, ./card, ./chip, ./coming-soon (+23 more)

### Community 8 - "Admin Products & Calendar UI"
Cohesion: 0.12
Nodes (18): CalendarDay, Card(), CardProps, Padding, paddingClass, Tint, tintClass, Width (+10 more)

### Community 9 - "Admin Agency Management"
Cohesion: 0.17
Nodes (14): agencies, Agency, CalendarIcon(), CalendarIconProps, ConfirmPopup(), ConfirmPopupProps, barSizeClass, IconX() (+6 more)

### Community 10 - "TypeScript Config Package Manifest"
Cohesion: 0.08
Nodes (23): eslint-config-prettier, @eslint/js, eslint-plugin-react, eslint-plugin-react-hooks, globals, @next/eslint-plugin-next, dependencies, eslint-config-prettier (+15 more)

### Community 11 - "Admin Accounts & Agency Onboarding"
Cohesion: 0.16
Nodes (15): LEVEL_LABEL, TODO: 실제 연동 시 여기서 POST /api/admin/agencies 호출로 교체한다., AdminLoginPage(), TODO: 실제 연동 시 여기서 세션/토큰을 저장하고, 이후 각 화면에서 로그인 여부를 확인한다., AdminAccount, adminAccounts, findAdminAccount(), AdminLevel (+7 more)

### Community 12 - "Root Workspace Manifest"
Cohesion: 0.09
Nodes (21): devDependencies, prettier, turbo, typescript, engines, node, turbo, typescript (+13 more)

### Community 13 - "API Client Package Manifest"
Cohesion: 0.10
Nodes (20): dependencies, @chinguya/types, devDependencies, @chinguya/eslint-config, @chinguya/typescript-config, typescript, exports, @chinguya/eslint-config (+12 more)

### Community 14 - "Types Package Manifest"
Cohesion: 0.11
Nodes (17): devDependencies, @chinguya/eslint-config, @chinguya/typescript-config, typescript, exports, @chinguya/eslint-config, @chinguya/typescript-config, typescript (+9 more)

### Community 15 - "Base TS Config"
Cohesion: 0.11
Nodes (17): compilerOptions, declaration, declarationMap, esModuleInterop, forceConsistentCasingInFileNames, isolatedModules, lib, module (+9 more)

### Community 16 - "Monorepo Structure & Core Business Rules"
Cohesion: 0.28
Nodes (15): apps/admin (관리자 모바일 웹), apps/agency (여행사 데스크톱 웹), apps/customer (고객 모바일 웹), 여행사 예약 상태 (즉시완료/즉시취소), 고객 예약 상태 흐름 (접수→완료→취소요청→취소), 디자인 토큰 단일화 (tailwind-config theme.css), 모노레포 구조 (apps + packages), packages/types 단일 출처 원칙 (+7 more)

### Community 17 - "Admin Asset Management"
Cohesion: 0.17
Nodes (10): TODO: 실제 연동 시 "오늘"은 일본 기준(JST)으로 판정하고, useDate === 오늘인 건만 필터링한다., assets, Badge(), NoticeBox(), NoticeBoxProps, Tone, toneClass, Stat() (+2 more)

### Community 18 - "Admin More Menu & Stack Layout"
Cohesion: 0.15
Nodes (11): MENU_ITEMS, Align, alignClass, Direction, directionClass, Gap, gapClass, Justify (+3 more)

### Community 19 - "Customer Next.js TS Config"
Cohesion: 0.14
Nodes (13): compilerOptions, allowJs, baseUrl, paths, exclude, extends, include, @chinguya/typescript-config/nextjs.json (+5 more)

### Community 20 - "Admin Next.js TS Config"
Cohesion: 0.14
Nodes (13): compilerOptions, allowJs, baseUrl, paths, exclude, extends, include, @chinguya/typescript-config/nextjs.json (+5 more)

### Community 21 - "Agency Next.js TS Config"
Cohesion: 0.14
Nodes (13): compilerOptions, allowJs, baseUrl, paths, exclude, extends, include, @chinguya/typescript-config/nextjs.json (+5 more)

### Community 22 - "Landing & Product Browsing Screens"
Cohesion: 0.15
Nodes (14): S4-A3 콘텐츠 관리 (와이어프레임), 안A 랜딩(상품 우선형) (와이어프레임), S0-C1 회원가입 — 소셜 (와이어프레임), S0-C2 회원가입 — 아이디 (와이어프레임), S1-C1 상품 조회 (와이어프레임), S3-C1 상품 상세 (와이어프레임), S4-C2 서비스 소개 (와이어프레임), 안A 랜딩(상품 우선형) (페이지정의서) (+6 more)

### Community 23 - "Next.js Shared TS Config Preset"
Cohesion: 0.14
Nodes (13): compilerOptions, incremental, jsx, lib, noEmit, plugins, display, extends (+5 more)

### Community 24 - "Cancellation Fee & Reservation List Screens"
Cohesion: 0.18
Nodes (13): S1-A10 계좌·정책 설정 (와이어프레임), S1-A9 취소요청 처리 (와이어프레임), S2-G6 여행사 예약 목록 (와이어프레임), S1-C5 예약 목록 (와이어프레임), S1-C6 예약 상세·바우처 (와이어프레임), S1-C7 취소 요청 (와이어프레임), S1-A10 계좌·정책 설정 (페이지정의서), S1-A9 취소요청 처리 (페이지정의서) (+5 more)

### Community 25 - "Booking Calendar & Agency Onboarding Screens"
Cohesion: 0.18
Nodes (13): S2-G1 계정 등록(초대 링크) (와이어프레임), S2-G2 여행사 로그인 (와이어프레임), S2-G3 여행사 대시보드 (와이어프레임), S2-G4 상품 조회 (와이어프레임), S2-G5 예약 (와이어프레임), S1-C2 예약·캘린더 (와이어프레임), S1-C2 예약·캘린더 (페이지정의서), S2-G1 계정 등록(초대 링크) (페이지정의서) (+5 more)

### Community 26 - "Shared ESLint Configs"
Cohesion: 0.29
Nodes (3): config, config, config

### Community 27 - "Button Component"
Cohesion: 0.18
Nodes (11): Align, alignClass, buildClassName(), Button(), ButtonProps, CommonProps, Padding, Size (+3 more)

### Community 28 - "Payment Policy & Admin Reservation Screens"
Cohesion: 0.20
Nodes (11): S0-A2 관리자 로그인 (와이어프레임), S1-A1 대시보드 (와이어프레임), S1-A6 예약 관리 목록 (와이어프레임), S1-A7 예약 상세 (와이어프레임), S1-A8 입금확인 (와이어프레임), S0-A2 관리자 로그인 (페이지정의서), S1-A1 대시보드 (페이지정의서), S1-A6 예약 관리 목록 (페이지정의서) (+3 more)

### Community 29 - "React Library TS Config Preset"
Cohesion: 0.18
Nodes (10): compilerOptions, jsx, lib, display, extends, ./base.json, DOM, DOM.Iterable (+2 more)

### Community 30 - "Wireframes Package Manifest"
Cohesion: 0.18
Nodes (10): dependencies, @chinguya/types, @chinguya/types, name, private, scripts, lint, typecheck (+2 more)

### Community 31 - "Shared Dev Dependencies"
Cohesion: 0.18
Nodes (11): devDependencies, @chinguya/eslint-config, @chinguya/typescript-config, @types/react, @types/react-dom, typescript, @chinguya/eslint-config, @chinguya/typescript-config (+3 more)

### Community 32 - "Link Component"
Cohesion: 0.18
Nodes (10): Align, alignClass, LinkButtonProps, LinkProps, Size, sizeClass, Underline, underlineClass (+2 more)

### Community 33 - "Base TS Config Preset"
Cohesion: 0.20
Nodes (9): compilerOptions, lib, noEmit, extends, include, @chinguya/typescript-config/base.json, DOM, ES2022 (+1 more)

### Community 34 - "Text Component"
Cohesion: 0.20
Nodes (9): Size, sizeClass, TextProps, Tone, toneClass, Variant, variantClass, Weight (+1 more)

### Community 35 - "Admin Settings Data"
Cohesion: 0.28
Nodes (6): TODO: 실제 연동 시 여기서 PUT /api/admin/settings 호출로 교체한다., cancellationFeeRules, depositAccount, offSiteReturnFeeKrw, CancellationFeeRule, DepositAccount

### Community 36 - "Next/React Peer Dependencies"
Cohesion: 0.22
Nodes (9): next, react, next, react, react-dom, peerDependencies, next, react (+1 more)

### Community 37 - "Top-level Docs & Screen-Code Convention"
Cohesion: 0.36
Nodes (5): 친구야_페이지정의서.md (페이지 정의서), CLAUDE.md (모노레포 협업 가이드), 화면 코드(id/S-코드) 주석 규약, docs/claude-code-prompt.md (클로드 코드 프롬프트 모음), README.md (프로젝트 개요)

### Community 38 - "FAQ & Inquiry Screens"
Cohesion: 0.25
Nodes (8): S4-A1 FAQ 관리 (와이어프레임), S4-C3 FAQ (와이어프레임), S4-C4 질문하기 — 목록 (와이어프레임), S4-C5 질문하기 — 상세/작성 (와이어프레임), S4-A1 FAQ 관리 (페이지정의서), S4-C3 FAQ (페이지정의서), S4-C4 질문하기 — 목록 (페이지정의서), S4-C5 질문하기 — 상세/작성 (페이지정의서)

### Community 39 - "TypeScript Config Package Files"
Cohesion: 0.25
Nodes (7): files, base.json, name, private, version, nextjs.json, react-library.json

### Community 40 - "Input Component"
Cohesion: 0.25
Nodes (7): As, BaseProps, CustomType, customTypeClass, InputProps, Size, sizeClass

### Community 41 - "Title Component"
Cohesion: 0.25
Nodes (7): Size, sizeClass, TitleProps, Tone, toneClass, Weight, weightClass

### Community 42 - "Invoice Policy Screens"
Cohesion: 0.33
Nodes (7): S2-A5 인보이스 목록 (와이어프레임), S2-A6 인보이스 상세 (와이어프레임), S2-G7 여행사 인보이스 (와이어프레임), S2-A5 인보이스 목록 (페이지정의서), S2-A6 인보이스 상세 (페이지정의서), S2-G7 여행사 인보이스 (페이지정의서), 인보이스 정책 (매월 1일 전월 기준 발행, KRW)

### Community 43 - "Passport Name Policy & Cart/Deposit Screens"
Cohesion: 0.29
Nodes (7): S0-C3 회원정보 수정 (와이어프레임), S1-C3 장바구니 (와이어프레임), S1-C4 입금 안내·확인 요청 (와이어프레임), S0-C3 회원정보 수정 (페이지정의서), S1-C3 장바구니 (페이지정의서), S1-C4 입금 안내·확인 요청 (페이지정의서), 여권 영문명 확보 정책 (예약 시점)

### Community 44 - "Types Package TS Config"
Cohesion: 0.29
Nodes (6): compilerOptions, noEmit, extends, include, @chinguya/typescript-config/base.json, src

### Community 45 - "UI Package TS Config"
Cohesion: 0.29
Nodes (6): compilerOptions, noEmit, extends, include, src, @chinguya/typescript-config/react-library.json

### Community 46 - "Agency Management Screens"
Cohesion: 0.33
Nodes (6): S2-A1 여행사 목록 (와이어프레임), S2-A2 여행사 등록(초대) (와이어프레임), S2-A3 여행사 상세 (와이어프레임), S2-A1 여행사 목록 (페이지정의서), S2-A2 여행사 등록(초대) (페이지정의서), S2-A3 여행사 상세 (페이지정의서)

### Community 47 - "Tailwind Config Package"
Cohesion: 0.33
Nodes (5): exports, ./theme.css, name, private, version

### Community 48 - "Admin Permission Tier Screens"
Cohesion: 0.50
Nodes (5): S0-A5 관리자 목록 (와이어프레임), S0-A6 관리자 등록/수정 (와이어프레임), S0-A5 관리자 목록 (페이지정의서), S0-A6 관리자 등록/수정 (페이지정의서), 관리자 권한 등급 (슈퍼어드민 쓰기 / 일반 조회전용)

### Community 49 - "Inventory Formula Screens"
Cohesion: 0.50
Nodes (5): S1-A3 날짜별 재고 세팅 (와이어프레임), S2-A4 날짜별 할당 세팅 (와이어프레임), S1-A3 날짜별 재고 세팅 (페이지정의서), S2-A4 날짜별 할당 세팅 (페이지정의서), 재고 산식 (총 보유 − 여행사 할당 = 고객 가용)

### Community 50 - "Dual Pricing Screens"
Cohesion: 0.40
Nodes (5): S1-A4 상품 관리 목록 (와이어프레임), S1-A5 상품 등록/수정 (와이어프레임), S1-A4 상품 관리 목록 (페이지정의서), S1-A5 상품 등록/수정 (페이지정의서), 가격 이원화 (고객가/여행사가)

## Knowledge Gaps
- **448 isolated node(s):** `nextConfig`, `name`, `version`, `private`, `type` (+443 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **22 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `packages/types (도메인 타입/비즈니스 규칙 단일 출처)` connect `Monorepo Structure & Core Business Rules` to `Top-level Docs & Screen-Code Convention`, `Invoice Policy Screens`, `Passport Name Policy & Cart/Deposit Screens`, `Inventory Formula Screens`, `Dual Pricing Screens`, `Cancellation Fee & Reservation List Screens`, `Booking Calendar & Agency Onboarding Screens`, `Payment Policy & Admin Reservation Screens`?**
  _High betweenness centrality (0.008) - this node is a cross-community bridge._
- **Why does `Text()` connect `Admin Agency Management` to `Admin Product Editing`, `Admin Allocation & Invoicing Data`, `Text Component`, `Admin Settings Data`, `Admin Dashboard & Reservation Actions`, `Admin Products & Calendar UI`, `Admin Accounts & Agency Onboarding`, `Admin Asset Management`, `Admin More Menu & Stack Layout`?**
  _High betweenness centrality (0.004) - this node is a cross-community bridge._
- **Why does `Title()` connect `Admin Products & Calendar UI` to `Admin Product Editing`, `Admin Allocation & Invoicing Data`, `Admin Settings Data`, `Admin Dashboard & Reservation Actions`, `Admin Agency Management`, `Title Component`, `Admin Accounts & Agency Onboarding`, `Admin Asset Management`, `Admin More Menu & Stack Layout`?**
  _High betweenness centrality (0.003) - this node is a cross-community bridge._
- **What connects `nextConfig`, `name`, `version` to the rest of the system?**
  _448 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Admin Product Editing` be split into smaller, more focused modules?**
  _Cohesion score 0.05764411027568922 - nodes in this community are weakly interconnected._
- **Should `Admin Allocation & Invoicing Data` be split into smaller, more focused modules?**
  _Cohesion score 0.06570048309178744 - nodes in this community are weakly interconnected._
- **Should `Customer App Package Manifest` be split into smaller, more focused modules?**
  _Cohesion score 0.044444444444444446 - nodes in this community are weakly interconnected._