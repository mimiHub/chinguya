#!/usr/bin/env bash
#
# 개발 EC2에 chinguya-web 을 올릴 자리를 **한 번만** 만든다(systemd 유닛 + nginx server 블록).
# 이후 배포는 script/deploy-web-dev.sh 로 한다.
#
#   ./script/setup-web-dev.sh
#
# ⚠ 이 인스턴스는 다른 **운영 사이트(1daybus.co.kr)와 공유**한다. 그래서 이 스크립트는
#   - 기존 nginx 설정 파일을 절대 수정하지 않는다. conf.d/zz-chinguya-web-dev.conf 를 새로 만들 뿐이다.
#   - 파일명이 `zz-` 로 시작하는 건 취향이 아니다. nginx.conf 는 conf.d/*.conf 를 기본 server
#     블록보다 **먼저** include 하므로, conf.d 에서 알파벳순 첫 번째 server 가 그 인스턴스의
#     기본 서버(Host 가 안 맞는 요청을 받는 자리)가 된다. 이름을 뒤로 밀지 않으면 우리 블록이
#     onedaybus.conf 를 제치고 기본 서버를 가져가, 도메인 없이 IP 로 들어온 요청이 1daybus 가
#     아니라 우리 앱(또는 502)으로 간다.
#   - 그래도 되돌릴 수 있게 /etc/nginx 전체를 타임스탬프 붙여 백업한다.
#   - reload 전에 `nginx -t` 로 검증하고, 실패하면 새 파일을 지우고 원상 복구한다.
#   - 포트는 3100~3102 를 쓴다. 3001 은 그 사이트가 쓰고 있다.
#
# 접속 주소는 nip.io 와일드카드 DNS 를 쓴다({IP}.nip.io → 그 IP 로 해석된다).
# 도메인을 새로 사지 않고도 Host 헤더로 앱을 가를 수 있어서, 기존 server 블록
# (server_name 1daybus.co.kr / _)과 겹치지 않는다.

set -euo pipefail

INSTANCE_ID=${INSTANCE_ID:-i-0141669a6b9940a5a}
AWS_REGION=${AWS_REGION:-ap-northeast-2}
SSH_KEY=${SSH_KEY:-$HOME/.ssh/aws-netjapan-key.pem}
SSH_USER=ec2-user
REMOTE_ROOT=/opt/chinguya/web-dev
CORE_API=http://localhost:8080

echo "==> EC2 퍼블릭 IP 조회 ($INSTANCE_ID)"
HOST=$(aws ec2 describe-instances --region "$AWS_REGION" --instance-ids "$INSTANCE_ID" \
	--query 'Reservations[0].Instances[0].PublicIpAddress' --output text)
[ -n "$HOST" ] && [ "$HOST" != "None" ] || { echo "퍼블릭 IP가 없다." >&2; exit 1; }
echo "    $HOST"

DASHED=${HOST//./-}
SSH="ssh -i $SSH_KEY -o ConnectTimeout=15 $SSH_USER@$HOST"

echo "==> systemd 유닛 생성"
# shellcheck disable=SC2086
$SSH "set -e
	sudo mkdir -p $REMOTE_ROOT
	sudo chown $SSH_USER:$SSH_USER $REMOTE_ROOT
	for pair in customer:3100 admin:3101 agency:3102; do
		app=\${pair%%:*}; port=\${pair##*:}
		sudo tee /etc/systemd/system/chinguya-web-\$app-dev.service >/dev/null <<UNIT
[Unit]
Description=chinguya web \$app (dev)
After=network.target chinguya-api-dev.service

[Service]
Type=simple
User=$SSH_USER
WorkingDirectory=$REMOTE_ROOT/\$app/apps/\$app
# Core API 는 같은 인스턴스에 있다. 퍼블릭 IP로 돌아 나가지 않게 localhost 로 붙는다.
Environment=NODE_ENV=production
Environment=APP_ENV=dev
Environment=CORE_API_BASE_URL=$CORE_API
Environment=PORT=\$port
Environment=HOSTNAME=0.0.0.0
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=5
# 2GB 인스턴스에 JVM·Postgres·1daybus 가 같이 산다. 한 앱이 폭주해도 서로 밀어내지 않게 상한을 둔다.
MemoryMax=320M

[Install]
WantedBy=multi-user.target
UNIT
	done
	sudo systemctl daemon-reload
	# enable 까지 해 둬야 인스턴스를 재시작해도 세 앱이 다시 올라온다.
	sudo systemctl enable chinguya-web-customer-dev chinguya-web-admin-dev chinguya-web-agency-dev"

echo "==> nginx 백업"
STAMP=$(date +%Y%m%d-%H%M%S)
# shellcheck disable=SC2086
$SSH "sudo tar -czf /root/nginx-backup-$STAMP.tar.gz -C /etc nginx && sudo ls -la /root/nginx-backup-$STAMP.tar.gz"
echo "    /root/nginx-backup-$STAMP.tar.gz"

echo "==> nginx server 블록 생성 (로컬에서 만들어 전송한다 — 셸 이스케이프로 \$host 가 망가지지 않게)"
CONF_LOCAL=$(mktemp)
{
	echo "# 친구야 개발 환경 — 세 앱을 Host 헤더로 가른다. 파일명 zz- 는 기본 서버 자리를 뺏지 않기 위한 것이다(setup 스크립트 주석 참고)."
	echo "# 이 파일만 추가했고 기존 server 블록(1daybus.co.kr, 기본 _)은 건드리지 않았다."
	echo "# nip.io = {IP}.nip.io 를 그 IP 로 해석해 주는 공개 와일드카드 DNS. 도메인 없이 쓰려고 골랐다."
	for pair in "customer:3100" "admin:3101" "agency:3102"; do
		app=${pair%%:*}; port=${pair##*:}
		cat <<CONF
server {
    listen 80;
    server_name $app.$DASHED.nip.io;
    location / {
        proxy_pass http://127.0.0.1:$port;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
CONF
	done
} > "$CONF_LOCAL"

echo "==> nginx 설정 적용 (검증 실패하면 되돌린다)"
scp -i "$SSH_KEY" -o ConnectTimeout=15 "$CONF_LOCAL" "$SSH_USER@$HOST:/tmp/zz-chinguya-web-dev.conf"
rm -f "$CONF_LOCAL"
# shellcheck disable=SC2086
$SSH "set -e
	sudo install -o root -g root -m 644 /tmp/zz-chinguya-web-dev.conf /etc/nginx/conf.d/zz-chinguya-web-dev.conf
	rm -f /tmp/zz-chinguya-web-dev.conf
	if ! sudo nginx -t; then
		echo 'nginx -t 실패 — 추가한 파일을 되돌린다' >&2
		sudo rm -f /etc/nginx/conf.d/zz-chinguya-web-dev.conf
		sudo nginx -t
		exit 1
	fi
	sudo systemctl reload nginx"

echo
echo "구축 완료. 이제 배포한다:"
echo "    ./script/deploy-web-dev.sh"
echo
echo "접속 주소(배포 후):"
echo "    고객    http://customer.$DASHED.nip.io"
echo "    관리자  http://admin.$DASHED.nip.io"
echo "    여행사  http://agency.$DASHED.nip.io"
