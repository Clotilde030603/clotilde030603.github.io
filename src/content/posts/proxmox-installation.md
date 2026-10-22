---
title: "02. Proxmox 설치 및 실행"
date: 2024-05-20
summary: "Proxmox 설치 매체를 준비하고 설치·실행하는 과정을 정리합니다."
category: "개발/서버·가상화"
tags: []
sourceUrl: "https://learntoflyclotilde.tistory.com/entry/2-Proxmox-%EC%84%A4%EC%B9%98-%EB%B0%8F-%EC%8B%A4%ED%96%89"
draft: false
---

※Bios 진입 및 부팅 시 단축 : F11(브랜드 및 제조사별 상이)
---

## **설치 및 실행 방법**
2. 부팅 USB를 PC에 꽂고 부팅
4. "Install Proxmox VE" 선택 → Enter
6. END USER LICENSE AGREEMENT(EULA) → "I agree"
8. Proxmox Virtualization Environment(PPVE) → Target Harddisk : /dev/sda(50GB, VMware Virtual S), Options → Next
10. Country : Korea(South), Time zone: Asia/Seoul, Keyboard Layout: U.S. English → Next
12. 사용할 Password와 E-Mail 입력 → Next
14. 사용할 네트워크 어댑터와 IP 설정(Management interface : ens33 - 00:0c:29:95:dd:b3(e10000), Hostname(FQDN), IP Address, Netmask, Gateway, DNS Server) → Next
16. 설치 → 설치 완료 시 Reboot

---

## **Trouble Shooting**
- Problem : 외부에서 접근 불가
- Why? : WIFI 설정을 보니 IP Address Pool(대역)과 할당 받은 IP가 다름
- Trouble Shooting : IP Address, Gateway, DNS : 0.0.0.0으로 재설정 → Proxmox 재설치

---

## **참고 자료**

Proxmox 설치하기
URL을 새 탭에서 여시기 바랍니다. 아래 URL에서 Proxmox 5.2-1 버전을 다운로드합니다. https://dr...
blog.naver.com

제조사별 bios 단축키와 진입 및 바이오스 부팅순서 설정 방법 - 영상도 함께
브랜드 및 제조사별 바이오스(bios) 단축키와 실행안녕하세요. 나이스쪼 입니다. 많은 분들께서 포맷을 위...
blog.naver.com
