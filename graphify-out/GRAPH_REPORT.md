# Graph Report - chinguya-web  (2026-09-05)

## Corpus Check
- 184 files · ~2,196,186 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1439 nodes · 2499 edges · 121 communities (93 shown, 28 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 15 edges (avg confidence: 0.75)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4f14dec0`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

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
- 2. 관리자 페이지 (모바일)
- invoiceData.ts
- package.json
- @chinguya/mocks — Slice 1 MSW 목
- package.json
- 친구야 — 관리자 페이지 와이어프레임 상세 설명
- dependencies
- 친구야 — 고객 페이지 와이어프레임 상세 설명
- 1. 고객 페이지 (모바일)
- page.tsx
- page.tsx
- productData.ts
- CLAUDE.md — 친구야 프론트엔드 모노레포 협업 가이드
- README.md
- 친구야 — API 명세(spec) 변경 → MSW 목 동기화 가이드
- tsconfig.json
- tsconfig.json
- mockServiceWorker.js
- RentalCategoryKey
- allocationData.ts
- package.json
- 3. 여행사 페이지 (데스크톱)
- 1.1 화면 ID 및 변경된 부분
- index.ts
- 친구야 — 여행사 페이지 와이어프레임 상세 설명
- 친구야 — 페이지 정의서 (Page Definition)
- 클로드 코드용 프롬프트 — 친구야 프론트엔드
- scripts
- CLAUDE.md — 친구야 와이어프레임 협업 가이드
- 친구야 — MSW 적용 가이드 (퍼블리셔 / Claude Code용)
- package.json
- package.json
- stat.tsx
- middleware.ts
- checkbox.tsx
- @chinguya/tailwind-config
- tailwindcss
- faqData.ts
- BottomNav.tsx
- @chinguya/api-spec
- dropdown.tsx
- calendar-icon.tsx
- typescript

## God Nodes (most connected - your core abstractions)
1. `Title()` - 37 edges
2. `exports` - 35 edges
3. `Text()` - 35 edges
4. `Stack()` - 32 edges
5. `Button()` - 30 edges
6. `Card()` - 26 edges
7. `친구야 — 관리자 페이지 와이어프레임 상세 설명` - 20 edges
8. `packages/types (도메인 타입/비즈니스 규칙 단일 출처)` - 18 edges
9. `친구야 — 고객 페이지 와이어프레임 상세 설명` - 17 edges
10. `Input()` - 16 edges

## Surprising Connections (you probably didn't know these)
- `InvoiceLineItem` --references--> `RentalOptionKey`  [EXTRACTED]
  apps/admin/src/data/invoiceData.ts → packages/types/src/index.ts
- `AdminReservationRow` --references--> `CustomerReservationStatus`  [EXTRACTED]
  apps/admin/src/data/reservationData.ts → packages/types/src/index.ts
- `BookingRow` --references--> `RentalOptionKey`  [EXTRACTED]
  apps/agency/src/data/bookingData.ts → packages/types/src/index.ts
- `CreateAgencyReservationInput` --references--> `AgencyReservation`  [EXTRACTED]
  apps/agency/src/data/reservationData.ts → packages/types/src/index.ts
- `CartLine` --references--> `RentalOptionKey`  [EXTRACTED]
  apps/customer/src/context/CartContext.tsx → packages/types/src/index.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **재고 산식 흐름: 자산→재고세팅→할당→여행사가용** — concept_inventory_formula, chinguya_wireframes_page_definition_s1_a2, chinguya_wireframes_page_definition_s1_a3, chinguya_wireframes_page_definition_s2_a4, chinguya_wireframes_page_definition_s2_g4 [INFERRED 0.85]
- **고객 예약 상태 흐름에 참여하는 화면들 (접수→완료→취소요청→취소)** — concept_customer_reservation_states, chinguya_wireframes_page_definition_s1_c4, chinguya_wireframes_page_definition_s1_a8, chinguya_wireframes_page_definition_s1_c7, chinguya_wireframes_page_definition_s1_a9 [EXTRACTED 0.95]
- **packages/types 단일 출처를 소비하는 앱·패키지** — concept_single_source_of_truth_types, package_types, package_ui, package_api_client, app_customer, app_admin, app_agency [EXTRACTED 1.00]

## Communities (121 total, 28 thin omitted)

### Community 0 - "Admin Product Editing"
Cohesion: 0.11
Nodes (20): AboutTab, FEATURES, STORE_INFO, TABS, Banner(), BannerProps, heightClass, positionClass (+12 more)

### Community 1 - "Admin Allocation & Invoicing Data"
Cohesion: 0.09
Nodes (43): AdminAssetsPage(), AdminInventoryPage(), addAsset(), assets, deleteAsset(), isNameTaken(), listActiveAssets(), listDeletedAssets() (+35 more)

### Community 2 - "Customer App Package Manifest"
Cohesion: 0.04
Nodes (46): dependencies, @chinguya/api-client, @chinguya/catalog-data, @chinguya/types, @chinguya/ui, next, react, react-dom (+38 more)

### Community 3 - "Admin App Package Manifest"
Cohesion: 0.04
Nodes (46): dependencies, @chinguya/api-client, @chinguya/catalog-data, @chinguya/types, @chinguya/ui, next, react, react-dom (+38 more)

### Community 4 - "Agency App Package Manifest"
Cohesion: 0.12
Nodes (17): devDependencies, @chinguya/eslint-config, @chinguya/typescript-config, eslint, tailwindcss, @tailwindcss/postcss, @types/node, @types/react (+9 more)

### Community 5 - "Admin Dashboard & Reservation Actions"
Cohesion: 0.11
Nodes (23): AdminDashboardPage(), AdminReservationDetailPage(), priceText(), TODO: 실제 연동 시 POST /api/admin/reservations/{id}/confirm-deposit 호출로 교체, TODO: 실제 연동 시 POST /api/admin/reservations/{id}/force-cancel 호출로 교체. 재고 즉시 복원., TODO: 실제 연동 시 환불 이체 확인 후 POST /api/admin/reservations/{id}/confirm-cancel. 재고 즉시, AdminReservationsPageInner(), TABS (+15 more)

### Community 6 - "App Root Layout & Bottom Nav"
Cohesion: 0.06
Nodes (33): metadata, AgencyLoginPage(), ITEMS, Sidebar(), AgencyAccount, agencyAccounts, CURRENT_AGENCY, findAgencyAccount() (+25 more)

### Community 7 - "UI Package Exports"
Cohesion: 0.06
Nodes (35): exports, ./alert, ./badge, ./banner, ./button, ./calendar, ./calendar-icon, ./card (+27 more)

### Community 8 - "Admin Products & Calendar UI"
Cohesion: 0.12
Nodes (16): CATEGORY_BADGE_VARIANT, NEWS_ITEMS, NewsItem, NOTICE_TABS, NoticeCategory, NoticePage(), Align, alignClass (+8 more)

### Community 9 - "Admin Agency Management"
Cohesion: 0.15
Nodes (17): TODO: 실제 연동 시 POST /api/admin/invoices/{id}/confirm-deposit 호출로 교체, agencies, ContactTab, QnaEntry, QnaView, Badge(), BadgeProps, label (+9 more)

### Community 10 - "TypeScript Config Package Manifest"
Cohesion: 0.08
Nodes (23): eslint-config-prettier, @eslint/js, eslint-plugin-react, eslint-plugin-react-hooks, globals, @next/eslint-plugin-next, base.js, next.js (+15 more)

### Community 11 - "Admin Accounts & Agency Onboarding"
Cohesion: 0.10
Nodes (30): ROLE_LABEL, TODO: 실제 연동 시 여기서 POST /api/admin/agencies 호출로 교체한다., WEEKDAY_LABELS, TODO: 실제 연동 시 여기서 POST(신규)/PATCH(수정) 호출 후 성공하면 목록으로 이동한다., TODO: 실제 연동 시 여기서 PUT /api/admin/settings 호출로 교체한다., TODO: 실제 연동 시 초대 토큰과 함께 POST /api/agency/invite/complete 호출로 교체., TODO: 실제 연동 시 여기서 세션/토큰을 저장한다., Alert() (+22 more)

### Community 12 - "Root Workspace Manifest"
Cohesion: 0.06
Nodes (30): dotenv-cli, http-server, devDependencies, dotenv-cli, http-server, prettier, turbo, typescript (+22 more)

### Community 13 - "API Client Package Manifest"
Cohesion: 0.08
Nodes (23): dependencies, @chinguya/types, devDependencies, @chinguya/eslint-config, @chinguya/typescript-config, @types/node, typescript, exports (+15 more)

### Community 14 - "Types Package Manifest"
Cohesion: 0.11
Nodes (17): @chinguya/eslint-config, @chinguya/typescript-config, typescript, devDependencies, @chinguya/eslint-config, @chinguya/typescript-config, typescript, exports (+9 more)

### Community 15 - "Base TS Config"
Cohesion: 0.11
Nodes (17): ES2022, compilerOptions, declaration, declarationMap, esModuleInterop, forceConsistentCasingInFileNames, isolatedModules, lib (+9 more)

### Community 16 - "Monorepo Structure & Core Business Rules"
Cohesion: 0.33
Nodes (13): apps/admin (관리자 모바일 웹), apps/agency (여행사 데스크톱 웹), apps/customer (고객 모바일 웹), 디자인 토큰 단일화 (tailwind-config theme.css), 모노레포 구조 (apps + packages), packages/types 단일 출처 원칙, 세 사용자군 (고객/관리자/여행사), packages/api-client (타입드 fetch 래퍼) (+5 more)

### Community 18 - "Admin More Menu & Stack Layout"
Cohesion: 0.09
Nodes (22): MENU_ITEMS, TODO: 실제 연동 시 "오늘"은 일본 기준(JST)으로 판정하고, useDate === 오늘인 건만 필터링한다., initialInquiries, InquiryEntry, StatusBadge(), Card(), CardProps, Padding (+14 more)

### Community 19 - "Customer Next.js TS Config"
Cohesion: 0.14
Nodes (13): @chinguya/typescript-config/nextjs.json, next-env.d.ts, .next/types/**/*.ts, node_modules, **/*.ts, **/*.tsx, compilerOptions, allowJs (+5 more)

### Community 20 - "Admin Next.js TS Config"
Cohesion: 0.14
Nodes (13): @chinguya/typescript-config/nextjs.json, next-env.d.ts, .next/types/**/*.ts, node_modules, **/*.ts, **/*.tsx, compilerOptions, allowJs (+5 more)

### Community 21 - "Agency Next.js TS Config"
Cohesion: 0.14
Nodes (13): @chinguya/typescript-config/nextjs.json, next-env.d.ts, .next/types/**/*.ts, node_modules, **/*.ts, **/*.tsx, compilerOptions, allowJs (+5 more)

### Community 22 - "Landing & Product Browsing Screens"
Cohesion: 0.15
Nodes (14): S4-A3 콘텐츠 관리 (와이어프레임), 안A 랜딩(상품 우선형) (와이어프레임), S0-C1 회원가입 — 소셜 (와이어프레임), S0-C2 회원가입 — 아이디 (와이어프레임), S1-C1 상품 조회 (와이어프레임), S3-C1 상품 상세 (와이어프레임), S4-C2 서비스 소개 (와이어프레임), 안A 랜딩(상품 우선형) (페이지정의서) (+6 more)

### Community 23 - "Next.js Shared TS Config Preset"
Cohesion: 0.14
Nodes (13): ./base.json, DOM, DOM.Iterable, ES2022, compilerOptions, incremental, jsx, lib (+5 more)

### Community 24 - "Cancellation Fee & Reservation List Screens"
Cohesion: 0.18
Nodes (9): metadata, MswProvider(), Footer(), INFO_LINES, InfoLine, CartContext, CartContextValue, CartLine (+1 more)

### Community 25 - "Booking Calendar & Agency Onboarding Screens"
Cohesion: 0.11
Nodes (23): S2-G1 계정 등록(초대 링크) (와이어프레임), S2-G2 여행사 로그인 (와이어프레임), S2-G3 여행사 대시보드 (와이어프레임), S2-G4 상품 조회 (와이어프레임), S2-G5 예약 (와이어프레임), S2-G6 여행사 예약 목록 (와이어프레임), S1-C2 예약·캘린더 (와이어프레임), S1-C5 예약 목록 (와이어프레임) (+15 more)

### Community 26 - "Shared ESLint Configs"
Cohesion: 0.27
Nodes (3): config, config, config

### Community 27 - "Button Component"
Cohesion: 0.07
Nodes (37): register(), worker, buildAvailability(), daysRequired(), depositAccountBase, iso(), products, S (+29 more)

### Community 28 - "Payment Policy & Admin Reservation Screens"
Cohesion: 0.13
Nodes (16): S0-A2 관리자 로그인 (와이어프레임), S1-A1 대시보드 (와이어프레임), S1-A10 계좌·정책 설정 (와이어프레임), S1-A6 예약 관리 목록 (와이어프레임), S1-A7 예약 상세 (와이어프레임), S1-A8 입금확인 (와이어프레임), S1-A9 취소요청 처리 (와이어프레임), S0-A2 관리자 로그인 (페이지정의서) (+8 more)

### Community 29 - "React Library TS Config Preset"
Cohesion: 0.18
Nodes (10): ./base.json, DOM, DOM.Iterable, ES2022, compilerOptions, jsx, lib, display (+2 more)

### Community 30 - "Wireframes Package Manifest"
Cohesion: 0.18
Nodes (10): dependencies, @chinguya/types, @chinguya/types, name, private, scripts, lint, typecheck (+2 more)

### Community 31 - "Shared Dev Dependencies"
Cohesion: 0.18
Nodes (11): devDependencies, @chinguya/eslint-config, @chinguya/typescript-config, @types/react, @types/react-dom, typescript, @chinguya/eslint-config, @chinguya/typescript-config (+3 more)

### Community 32 - "Link Component"
Cohesion: 0.17
Nodes (11): Align, alignClass, Link(), LinkButtonProps, LinkProps, Size, sizeClass, Underline (+3 more)

### Community 33 - "Base TS Config Preset"
Cohesion: 0.20
Nodes (9): @chinguya/typescript-config/base.json, DOM, ES2022, src, compilerOptions, lib, noEmit, extends (+1 more)

### Community 34 - "Text Component"
Cohesion: 0.20
Nodes (9): Size, sizeClass, TextProps, Tone, toneClass, Variant, variantConfig, Weight (+1 more)

### Community 35 - "Admin Settings Data"
Cohesion: 0.18
Nodes (10): AdminAccount, adminAccounts, depositAccount, initialInquiries, AdminRole, Agency, BOOKING_WINDOW, DepositAccount (+2 more)

### Community 36 - "Next/React Peer Dependencies"
Cohesion: 0.22
Nodes (9): next, react, next, react, react-dom, peerDependencies, next, react (+1 more)

### Community 37 - "Top-level Docs & Screen-Code Convention"
Cohesion: 0.36
Nodes (4): 친구야_페이지정의서.md (페이지 정의서), CLAUDE.md (모노레포 협업 가이드), 화면 코드(id/S-코드) 주석 규약, README.md (프로젝트 개요)

### Community 38 - "FAQ & Inquiry Screens"
Cohesion: 0.25
Nodes (8): S4-A1 FAQ 관리 (와이어프레임), S4-C3 FAQ (와이어프레임), S4-C4 질문하기 — 목록 (와이어프레임), S4-C5 질문하기 — 상세/작성 (와이어프레임), S4-A1 FAQ 관리 (페이지정의서), S4-C3 FAQ (페이지정의서), S4-C4 질문하기 — 목록 (페이지정의서), S4-C5 질문하기 — 상세/작성 (페이지정의서)

### Community 39 - "TypeScript Config Package Files"
Cohesion: 0.25
Nodes (7): base.json, nextjs.json, react-library.json, files, name, private, version

### Community 40 - "Input Component"
Cohesion: 0.10
Nodes (30): CartPage(), formatCountdown(), lineAmount(), rentalDaysOf(), MyPage(), fromPriceOf(), Page(), RENTAL_CATEGORIES (+22 more)

### Community 41 - "Title Component"
Cohesion: 0.15
Nodes (10): RENTAL_OPTION_LABEL, Size, sizeClass, TitleProps, Tone, toneClass, Weight, weightClass (+2 more)

### Community 42 - "Invoice Policy Screens"
Cohesion: 0.33
Nodes (7): S2-A5 인보이스 목록 (와이어프레임), S2-A6 인보이스 상세 (와이어프레임), S2-G7 여행사 인보이스 (와이어프레임), S2-A5 인보이스 목록 (페이지정의서), S2-A6 인보이스 상세 (페이지정의서), S2-G7 여행사 인보이스 (페이지정의서), 인보이스 정책 (매월 1일 전월 기준 발행, KRW)

### Community 43 - "Passport Name Policy & Cart/Deposit Screens"
Cohesion: 0.29
Nodes (7): S0-C3 회원정보 수정 (와이어프레임), S1-C3 장바구니 (와이어프레임), S1-C4 입금 안내·확인 요청 (와이어프레임), S0-C3 회원정보 수정 (페이지정의서), S1-C3 장바구니 (페이지정의서), S1-C4 입금 안내·확인 요청 (페이지정의서), 여권 영문명 확보 정책 (예약 시점)

### Community 44 - "Types Package TS Config"
Cohesion: 0.29
Nodes (6): @chinguya/typescript-config/base.json, src, compilerOptions, noEmit, extends, include

### Community 45 - "UI Package TS Config"
Cohesion: 0.29
Nodes (6): src, @chinguya/typescript-config/react-library.json, compilerOptions, noEmit, extends, include

### Community 46 - "Agency Management Screens"
Cohesion: 0.33
Nodes (6): S2-A1 여행사 목록 (와이어프레임), S2-A2 여행사 등록(초대) (와이어프레임), S2-A3 여행사 상세 (와이어프레임), S2-A1 여행사 목록 (페이지정의서), S2-A2 여행사 등록(초대) (페이지정의서), S2-A3 여행사 상세 (페이지정의서)

### Community 47 - "Tailwind Config Package"
Cohesion: 0.23
Nodes (9): { GET, POST, PUT, PATCH, DELETE }, { GET, POST, PUT, PATCH, DELETE }, { GET, POST, PUT, PATCH, DELETE }, BODYLESS_STATUS, coreBaseUrl(), CoreProxyOptions, createCoreProxyHandlers(), proxy() (+1 more)

### Community 48 - "Admin Permission Tier Screens"
Cohesion: 0.50
Nodes (5): S0-A5 관리자 목록 (와이어프레임), S0-A6 관리자 등록/수정 (와이어프레임), S0-A5 관리자 목록 (페이지정의서), S0-A6 관리자 등록/수정 (페이지정의서), 관리자 권한 등급 (슈퍼어드민 쓰기 / 일반 조회전용)

### Community 49 - "Inventory Formula Screens"
Cohesion: 0.50
Nodes (5): S1-A3 날짜별 재고 세팅 (와이어프레임), S2-A4 날짜별 할당 세팅 (와이어프레임), S1-A3 날짜별 재고 세팅 (페이지정의서), S2-A4 날짜별 할당 세팅 (페이지정의서), 재고 산식 (총 보유 − 여행사 할당 = 고객 가용)

### Community 50 - "Dual Pricing Screens"
Cohesion: 0.40
Nodes (5): S1-A4 상품 관리 목록 (와이어프레임), S1-A5 상품 등록/수정 (와이어프레임), S1-A4 상품 관리 목록 (페이지정의서), S1-A5 상품 등록/수정 (페이지정의서), 가격 이원화 (고객가/여행사가)

### Community 52 - "Table Component"
Cohesion: 0.06
Nodes (55): AdminProductEditPage(), AdminProductVariant, adminProductVariants, buildVariants(), CATEGORY_LABEL, findAdminProductVariantById(), price(), RENTAL_OPTION_ORDER (+47 more)

### Community 76 - "2. 관리자 페이지 (모바일)"
Cohesion: 0.22
Nodes (10): DepositContent(), ReservationCancelPage(), ReservationDetailPage(), cancellationFeeRules, getCancellationFeeRate(), getDaysBeforeUse(), findReservationById(), findReservationsByIds() (+2 more)

### Community 77 - "invoiceData.ts"
Cohesion: 0.16
Nodes (17): AdminInvoiceDetailPage(), AdminInvoicesPage(), agencyReservations, now, prevDate, findInvoiceById(), getCurrentPeriod(), getInvoiceLineItems() (+9 more)

### Community 78 - "package.json"
Cohesion: 0.09
Nodes (21): msw, openapi-typescript, dependencies, msw, devDependencies, @chinguya/typescript-config, openapi-typescript, typescript (+13 more)

### Community 79 - "@chinguya/mocks — Slice 1 MSW 목"
Cohesion: 0.20
Nodes (9): baseUrl (BFF 참고), @chinguya/mocks — Slice 1 MSW 목, 구조, 앱(Next.js dev)에 붙이기, 원칙, 타입 생성 (핸들러보다 먼저), 테스트(Node)에 붙이기, 협의 미확정 → 목의 잠정값 (spec 확정 시 함께 갱신) (+1 more)

### Community 80 - "package.json"
Cohesion: 0.10
Nodes (20): dependencies, @chinguya/types, devDependencies, @chinguya/eslint-config, @chinguya/typescript-config, typescript, exports, @chinguya/eslint-config (+12 more)

### Community 81 - "친구야 — 관리자 페이지 와이어프레임 상세 설명"
Cohesion: 0.10
Nodes (20): `a-admins` · S0-A5/A6 — 관리자 관리, `a-agency` · S2-A1/A3 — 여행사 관리, `a-agencyadd` · S2-A2 — 여행사 등록(초대), `a-alloc` · S2-A4 — 날짜별 할당 세팅, `a-asset` · S1-A2 — 자산 관리, `a-cancel` · S1-A9 — 취소요청 처리, `a-cms` · S4-A1/A3 — FAQ · 콘텐츠 관리 (CMS-lite), `a-dash` · S1-A1 — 대시보드 (+12 more)

### Community 82 - "dependencies"
Cohesion: 0.12
Nodes (17): dependencies, @chinguya/api-client, @chinguya/catalog-data, @chinguya/mocks, @chinguya/types, @chinguya/ui, next, react (+9 more)

### Community 83 - "친구야 — 고객 페이지 와이어프레임 상세 설명"
Cohesion: 0.12
Nodes (17): `cancel` · S1-C7 — 취소 요청, `cart` · S1-C3 — 장바구니 · 예약 확인, `deposit` · S1-C4 — 입금 안내 · 확인 요청, `detail` · S3-C1 · S1-C2 — 상품 상세 · 예약 캘린더 (통합) **[2026-09-02 병합]**, `faq` · S4-C3 — FAQ, `landing` · 안 A — 랜딩(상품 우선형) **[확정]**, `list` · S1-C1 — 상품 조회, `myres` · S1-C5 — 예약 목록 (+9 more)

### Community 84 - "1. 고객 페이지 (모바일)"
Cohesion: 0.22
Nodes (10): createReservation(), CreateReservationInput, generateReservationId(), MY_RESERVATION_TAB_LABEL, MY_RESERVATION_TAB_ORDER, MyReservationTab, RESERVATION_STATUS_LABEL, reservations (+2 more)

### Community 87 - "page.tsx"
Cohesion: 0.17
Nodes (10): FormMode, ImagePreview, TODO: 실제 연동 시 PUT /api/admin/content/banners 호출로 교체하고, 이미지도 함께, TODO: 실제 연동 시 PUT /api/admin/content/intro 호출로 교체한다., BannerSlide, bannerSlides, IntroContent, Tab() (+2 more)

### Community 88 - "productData.ts"
Cohesion: 0.25
Nodes (7): getScrollThreshold(), NAV_ITEMS, TopNav(), barSizeClass, IconXProps, Size, sizeClass

### Community 89 - "CLAUDE.md — 친구야 프론트엔드 모노레포 협업 가이드"
Cohesion: 0.29
Nodes (5): metadata, BottomNav(), ICON_PROPS, ICONS, ITEMS

### Community 90 - "README.md"
Cohesion: 0.20
Nodes (5): 공통 비즈니스 규칙 (문서 간 일관성 기준), 문서 구성, 문서 유지 규칙, 서비스 개요, 친구야 — 와이어프레임 상세 설명 (문서 인덱스)

### Community 91 - "친구야 — API 명세(spec) 변경 → MSW 목 동기화 가이드"
Cohesion: 0.20
Nodes (9): 권장 — 타입 자동 최신화, 누락 감지 — onUnhandledRequest, 변경 유형별 수정 위치, 부록 — Claude Code 동기화 프롬프트, 새 slice 명세가 추가될 때 (slice2 등), 원칙 — 단방향 (spec → 타입 → 목), 체크리스트 (spec 바뀌면), 친구야 — API 명세(spec) 변경 → MSW 목 동기화 가이드 (+1 more)

### Community 92 - "tsconfig.json"
Cohesion: 0.20
Nodes (9): compilerOptions, lib, noEmit, extends, include, @chinguya/typescript-config/base.json, DOM, ES2022 (+1 more)

### Community 93 - "tsconfig.json"
Cohesion: 0.20
Nodes (9): compilerOptions, lib, noEmit, extends, include, @chinguya/typescript-config/base.json, DOM, ES2022 (+1 more)

### Community 94 - "mockServiceWorker.js"
Cohesion: 0.42
Nodes (8): activeClientIds, getResponse(), handleRequest(), IS_MOCKED_RESPONSE, resolveMainClient(), respondWithMock(), sendToClient(), serializeRequest()

### Community 95 - "RentalCategoryKey"
Cohesion: 0.32
Nodes (6): AdminLoginPage(), AdminMorePage(), TopHeader(), useAdminAuth(), IconHamburger(), IconHamburgerProps

### Community 96 - "allocationData.ts"
Cohesion: 0.43
Nodes (7): AdminAllocationsPage(), getAllocatedQty(), getTotalAllocatedQty(), mapKey(), mockAllocations, saveAllocatedQty(), AgencyAllocation

### Community 97 - "package.json"
Cohesion: 0.25
Nodes (7): msw, workerDirectory, name, private, type, version, public

### Community 98 - "3. 여행사 페이지 (데스크톱)"
Cohesion: 0.25
Nodes (7): CalendarProps, CalendarRange, dayClass, DayStatus, NOT_SELECTABLE_BOOKING, NOT_SELECTABLE_INVENTORY, WEEKDAYS

### Community 99 - "1.1 화면 ID 및 변경된 부분"
Cohesion: 0.25
Nodes (7): 1.1 화면 ID 및 변경된 부분, 1.2 예약 상태 흐름 변경 (중요), 1. 와이어프레임 변경사항, 구조·추적 변경, 상태 흐름 변경 (아래 1.2 — UI 영향 큼), 참고 — 아직 미확정(협의 중)이라 값이 바뀔 수 있는 부분, 친구야 — 퍼블리셔 전달: 와이어프레임 변경사항

### Community 100 - "index.ts"
Cohesion: 0.25
Nodes (5): ApiClient, ApiClientOptions, ApiError, Invoice, Product

### Community 101 - "친구야 — 여행사 페이지 와이어프레임 상세 설명"
Cohesion: 0.29
Nodes (7): `g-book` · S2-G4/G5 — 상품 조회 · 예약, `g-dash` · S2-G3 — 여행사 대시보드, `g-invite` · S2-G1/G2 — 계정 등록(초대 링크) · 로그인, `g-invoice` · S2-G7 — 여행사 인보이스, `g-list` · S2-G6 — 여행사 예약 목록, 친구야 — 여행사 페이지 와이어프레임 상세 설명, 화면 ID 매핑표

### Community 102 - "친구야 — 페이지 정의서 (Page Definition)"
Cohesion: 0.33
Nodes (5): AdminAuthContext, AdminAuthError, AdminAuthProvider(), AdminAuthValue, AdminSession

### Community 103 - "클로드 코드용 프롬프트 — 친구야 프론트엔드"
Cohesion: 0.29
Nodes (7): 0. 공통 컨텍스트 (모든 작업 앞에 붙일 것), 1. 특정 앱의 화면 구현, 2. 도메인 타입 확장, 3. 공용 UI 컴포넌트 추가, 4. 스캐폴드 재생성 (처음부터 다시 만들 때), 작업 체크리스트 (매 작업 종료 전), 클로드 코드용 프롬프트 — 친구야 프론트엔드

### Community 104 - "scripts"
Cohesion: 0.33
Nodes (6): scripts, build, dev, lint, start, typecheck

### Community 105 - "CLAUDE.md — 친구야 와이어프레임 협업 가이드"
Cohesion: 0.33
Nodes (6): CLAUDE.md — 친구야 와이어프레임 협업 가이드, 문서 서술 스타일, 와이어프레임 작성 규약, 저장소 구조, ★ 핵심 규칙: 와이어프레임 ↔ 상세 설명 문서 동기화, 화면 코드 체계 (참고)

### Community 106 - "친구야 — MSW 적용 가이드 (퍼블리셔 / Claude Code용)"
Cohesion: 0.33
Nodes (5): 0. 동작 원리 (핵심 3조건), 1. 1회 배선 — PM이 반영 완료 (pull만 받으면 됨), 2. 화면 만들 때 규칙 (스크린 개발 프롬프트에 함께 넣기), 3. 동작 확인 / 트러블슈팅, 친구야 — MSW 적용 가이드 (퍼블리셔 / Claude Code용)

### Community 107 - "package.json"
Cohesion: 0.33
Nodes (5): exports, ./theme.css, name, private, version

### Community 108 - "package.json"
Cohesion: 0.50
Nodes (3): name, private, version

### Community 109 - "stat.tsx"
Cohesion: 0.50
Nodes (3): Stat(), StatItem, StatProps

### Community 113 - "tailwindcss"
Cohesion: 0.60
Nodes (5): coreBaseUrl(), DELETE(), GET(), POST(), readTokenFromSetCookie()

### Community 114 - "faqData.ts"
Cohesion: 0.40
Nodes (3): initialFaqEntries, faqEntries, FaqEntry

### Community 115 - "BottomNav.tsx"
Cohesion: 0.40
Nodes (4): BottomNav(), ICON_PROPS, ICONS, ITEMS

### Community 116 - "@chinguya/api-spec"
Cohesion: 0.50
Nodes (3): @chinguya/api-spec, 작업 규칙, 파일

### Community 117 - "dropdown.tsx"
Cohesion: 0.50
Nodes (3): Dropdown(), DropdownOption, DropdownProps

## Knowledge Gaps
- **675 isolated node(s):** `nextConfig`, `name`, `version`, `private`, `type` (+670 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **28 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `MswProvider()` connect `Cancellation Fee & Reservation List Screens` to `Button Component`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **Why does `.next/**` connect `App Root Layout & Bottom Nav` to `Cancellation Fee & Reservation List Screens`, `CLAUDE.md — 친구야 프론트엔드 모노레포 협업 가이드`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **Why does `Text()` connect `Admin Agency Management` to `Admin Product Editing`, `Text Component`, `Admin Dashboard & Reservation Actions`, `Input Component`, `Title Component`, `Admin Products & Calendar UI`, `Admin Accounts & Agency Onboarding`, `Admin More Menu & Stack Layout`, `Table Component`, `page.tsx`, `Cancellation Fee & Reservation List Screens`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **What connects `nextConfig`, `name`, `version` to the rest of the system?**
  _675 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Admin Product Editing` be split into smaller, more focused modules?**
  _Cohesion score 0.11397849462365592 - nodes in this community are weakly interconnected._
- **Should `Admin Allocation & Invoicing Data` be split into smaller, more focused modules?**
  _Cohesion score 0.08585858585858586 - nodes in this community are weakly interconnected._
- **Should `Customer App Package Manifest` be split into smaller, more focused modules?**
  _Cohesion score 0.0425531914893617 - nodes in this community are weakly interconnected._