#!/usr/bin/env bash
#
# chinguya-web(고객·관리자·여행사) 세 앱을 개발 EC2에 재배포한다.
#
#   ./script/deploy-web-dev.sh            # 세 앱 전부
#   ./script/deploy-web-dev.sh agency     # 하나만
#
# 하는 일: 로컬 standalone 빌드 → EC2 퍼블릭 IP 조회 → 번들 전송 → systemd 재시작 → 헬스체크.
#
# 전제
#   - aws cli 로그인 (ap-northeast-2 describe-instances 권한)
#   - SSH 키 ~/.ssh/aws-netjapan-key.pem
#   - EC2에 systemd 유닛 chinguya-web-{app}-dev.service 와 nginx server 블록이 이미 있음
#     (최초 구축은 script/setup-web-dev.sh 가 한 번 만든다)
#
# ⚠ 이 인스턴스는 **다른 운영 사이트(1daybus.co.kr)와 공유**한다. 그래서
#   - 포트는 3100~3102 를 쓴다. 3001 은 그 사이트가 이미 쓰고 있다.
#   - nginx 는 기존 server 블록을 건드리지 않고 별도 파일(conf.d/zz-chinguya-web-dev.conf)만 둔다.
#   - 이 스크립트는 nginx 를 reload 하지 않는다. 설정 변경은 setup 스크립트 소관이다.
#
# 인스턴스에 Elastic IP가 없어 stop/start 하면 퍼블릭 IP가 바뀐다. 그래서 IP를 하드코딩하지
# 않고 매번 인스턴스 ID로 조회한다.

set -euo pipefail

INSTANCE_ID=${INSTANCE_ID:-i-0141669a6b9940a5a}
AWS_REGION=${AWS_REGION:-ap-northeast-2}
SSH_KEY=${SSH_KEY:-$HOME/.ssh/aws-netjapan-key.pem}
SSH_USER=ec2-user
REMOTE_ROOT=/opt/chinguya/web-dev

# 앱 → 포트(유효한 앱 이름인지 검사하는 용도). 3001 은 1daybus 가 점유 중이라 3100 대를 쓴다.
# 이 포트들은 보안그룹이 외부에 열지 않는다 — 접속은 nginx :80 을 통해서만 한다.
declare -A PORTS=([customer]=3100 [admin]=3101 [agency]=3102)

# 앱 → 접속 도메인. Route53 → ALB(*.1daybus.com 인증서로 TLS 종료) → 이 인스턴스 :80
# → nginx(server_name 별) → 위 포트. 헬스체크가 Host 헤더로 쓰는 값이다.
declare -A DOMAINS=(
	[customer]=chinguya.1daybus.com
	[admin]=chinguya-admin.1daybus.com
	[agency]=chinguya-agency.1daybus.com
)

cd "$(dirname "$0")/.."

APPS=("$@")
if [ ${#APPS[@]} -eq 0 ]; then
	APPS=(customer admin agency)
fi
for APP in "${APPS[@]}"; do
	[ -n "${PORTS[$APP]:-}" ] || { echo "모르는 앱: $APP (customer|admin|agency)" >&2; exit 1; }
done

# 아래 빌드는 `apps/*/.next` 를 프로덕션 산출물로 갈아치운다. 그 폴더에서 `pnpm dev` 가
# 돌고 있으면 dev 서버가 참조하던 청크가 사라져 `Cannot find module './###.js'` 로 죽는다
# (2026-09-21에 실제로 로컬 3000·3002 를 깨뜨렸다).
#
# **이 체크아웃의** dev 서버만 막는다 — 별도 worktree 에서 배포하면 `.next` 가 달라서
# 안전하기 때문이다. 그래서 포트가 아니라 프로세스의 cwd 를 본다.
REPO_ROOT=$(pwd -P)
BLOCKING=$(pgrep -f next-server 2>/dev/null | while read -r pid; do
	CWD=$(lsof -a -p "$pid" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p')
	# case 대신 [[ ]] 를 쓴다 — 패턴의 `)` 를 명령 치환의 끝으로 오인하는 bash 가 있다.
	if [[ "$CWD" == "$REPO_ROOT"/apps/* ]]; then
		printf '    PID %s  %s\n' "$pid" "$CWD"
	fi
done || true)
if [ -n "$BLOCKING" ]; then
	{
		echo "이 체크아웃에서 dev 서버가 돌고 있다 — 배포 빌드가 그 .next 를 덮어써서 죽는다:"
		echo "$BLOCKING"
		echo
		echo "먼저 dev 를 멈추거나, 별도 worktree 에서 배포할 것(권장)."
		echo "이미 섞였으면 dev 를 멈춘 뒤: rm -rf apps/*/.next"
	} >&2
	exit 1
fi

echo "==> 1/5 빌드 (standalone)"
FILTERS=()
for APP in "${APPS[@]}"; do
	FILTERS+=(--filter "@chinguya/$APP")
done
pnpm exec dotenv -e env/dev.env -- turbo run build "${FILTERS[@]}"

echo "==> 2/5 EC2 퍼블릭 IP 조회 ($INSTANCE_ID)"
HOST=$(aws ec2 describe-instances --region "$AWS_REGION" --instance-ids "$INSTANCE_ID" \
	--query 'Reservations[0].Instances[0].PublicIpAddress' --output text)
[ -n "$HOST" ] && [ "$HOST" != "None" ] || { echo "퍼블릭 IP가 없다. 인스턴스가 실행 중인지 확인할 것." >&2; exit 1; }
echo "    $HOST"

SSH="ssh -i $SSH_KEY -o ConnectTimeout=15 $SSH_USER@$HOST"

for APP in "${APPS[@]}"; do
	echo "==> 3/5 [$APP] 번들 전송"
	# standalone 은 server.js 옆에 .next/static 과 public 을 넣어 주지 않는다 — 직접 합친다.
	STAGE=$(mktemp -d)
	trap 'rm -rf "$STAGE"' EXIT
	cp -R "apps/$APP/.next/standalone/." "$STAGE/"
	mkdir -p "$STAGE/apps/$APP/.next"
	cp -R "apps/$APP/.next/static" "$STAGE/apps/$APP/.next/static"
	[ -d "apps/$APP/public" ] && cp -R "apps/$APP/public" "$STAGE/apps/$APP/public"

	tar -czf "$STAGE.tar.gz" -C "$STAGE" .
	scp -i "$SSH_KEY" -o ConnectTimeout=15 "$STAGE.tar.gz" "$SSH_USER@$HOST:/tmp/chinguya-web-$APP.tar.gz"
	rm -rf "$STAGE" "$STAGE.tar.gz"
	trap - EXIT

	echo "==> 4/5 [$APP] 교체 & 재시작"
	# 새 디렉터리에 풀고 통째로 바꾼다 — 반쯤 덮어쓴 상태로 기동하는 일이 없게.
	# shellcheck disable=SC2086
	$SSH "set -e
		rm -rf $REMOTE_ROOT/$APP.new && mkdir -p $REMOTE_ROOT/$APP.new
		tar -xzf /tmp/chinguya-web-$APP.tar.gz -C $REMOTE_ROOT/$APP.new
		rm -f /tmp/chinguya-web-$APP.tar.gz
		rm -rf $REMOTE_ROOT/$APP.old
		[ -d $REMOTE_ROOT/$APP ] && mv $REMOTE_ROOT/$APP $REMOTE_ROOT/$APP.old || true
		mv $REMOTE_ROOT/$APP.new $REMOTE_ROOT/$APP
		sudo systemctl restart chinguya-web-$APP-dev
		rm -rf $REMOTE_ROOT/$APP.old"
done

echo "==> 5/5 헬스체크"
# 3100~3102 는 보안그룹이 막고 있다(의도적 — 외부 노출은 nginx :80 하나뿐이다).
# 그래서 포트를 직접 찌르지 않고 nginx 를 Host 헤더로 통과시켜 본다.
#
# ALB 를 거치지 않고 EC2 :80 을 바로 찌르므로 X-Forwarded-Proto 가 없다. nginx conf 가 그
# 값을 그대로 넘기게 돼 있어서(ALB 가 TLS 를 끝내므로) 비워 두면 앱이 평문으로 오인한다 —
# ALB 가 넣어 주는 값을 흉내내 https 로 넣어 준다.
FAILED=0
for APP in "${APPS[@]}"; do
	OK=0
	for _ in $(seq 1 20); do
		CODE=$(curl -s -m 5 -o /dev/null -w '%{http_code}' \
			-H "Host: ${DOMAINS[$APP]}" -H 'X-Forwarded-Proto: https' "http://$HOST/" || true)
		# 관리자·여행사는 미인증이면 로그인으로 307 을 낸다. 2xx/3xx 면 기동한 것이다.
		case "$CODE" in
			2??|3??) OK=1; break ;;
		esac
		sleep 3
	done
	if [ "$OK" = 1 ]; then
		echo "    OK — $APP  https://${DOMAINS[$APP]} ($CODE)"
	else
		echo "    실패 — $APP 가 60초 안에 기동하지 않았다 (마지막 응답 '$CODE')" >&2
		# shellcheck disable=SC2086
		$SSH "sudo journalctl -u chinguya-web-$APP-dev -n 30 --no-pager" >&2
		FAILED=1
	fi
done

exit $FAILED
