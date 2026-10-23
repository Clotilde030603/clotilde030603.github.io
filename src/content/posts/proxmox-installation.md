---
title: "02. Proxmox 설치 및 실행"
date: 2024-05-20
summary: ""
category: "개발/서버·가상화"
tags: []
sourceUrl: "https://learntoflyclotilde.tistory.com/entry/2-Proxmox-%EC%84%A4%EC%B9%98-%EB%B0%8F-%EC%8B%A4%ED%96%89"
draft: false
---

※ {{color:#9f6b53}}Bios 진입 및 부팅 시 단축 : F11(브랜드 및 제조사별 상이){{/color}}

---

## **{{color:#d9730d}}설치 및 실행 방법{{/color}}**

1. 부팅 USB를 PC에 꽂고 부팅

2. "Install Proxmox VE" 선택 > Enter

3. END USER LICENSE AGREEMENT(EULA) > "I agree"

4. Proxmox Virtualization Environment(PPVE) > Target Harddisk : /dev/sda(50GB, VMware Virtual S), Options > Next

5. Country : Korea(South), Time zone: Asia/Seoul, Keyboard Layout: U.S. English > Next

6. 사용할 Password와 E-Mail 입력 > Next

7. 사용할 네트워크 어댑터와 IP 설정(Management interface : ens33 - 00:0c:29:95:dd:b3(e10000), Hostname(FQDN), IP Address, Netmask, Gateway, DNS Server) > Next

8. 설치 > 설치 완료 시 Reboot

---

## **{{color:#337ea9}}Trouble Shooting{{/color}}**

- {{color:#ef5369}}Problem : 외부에서 접근 불가{{/color}}

- {{color:#ef5369}}Why? : WIFI 설정을 보니 IP Address Pool(대역)과 할당 받은 IP가 다름{{/color}}

- {{color:#99cefa}}Trouble Shooting : IP Address, Gateway, DNS : 0.0.0.0으로 재설정 > Proxmox 재설치{{/color}}

---

## **{{color:#337ea9}}참고 자료{{/color}}**

[![Link preview](/assets/posts/proxmox-installation/link-preview-01.jpg "dorami-card:%7B%22title%22%3A%20%22Proxmox%20%EC%84%A4%EC%B9%98%ED%95%98%EA%B8%B0%22%2C%20%22description%22%3A%20%22URL%EC%9D%84%20%EC%83%88%20%ED%83%AD%EC%97%90%EC%84%9C%20%EC%97%AC%EC%8B%9C%EA%B8%B0%20%EB%B0%94%EB%9E%8D%EB%8B%88%EB%8B%A4.%20%EC%95%84%EB%9E%98%20URL%EC%97%90%EC%84%9C%20Proxmox%205.2-1%20%EB%B2%84%EC%A0%84%EC%9D%84%20%EB%8B%A4%EC%9A%B4%EB%A1%9C%EB%93%9C%ED%95%A9%EB%8B%88%EB%8B%A4.%20https%3A%2F%2Fdr...%22%7D")](<https://m.blog.naver.com/17beans/221333143809>)

[![Link preview](/assets/posts/proxmox-installation/link-preview-02.jpg "dorami-card:%7B%22title%22%3A%20%22%EC%A0%9C%EC%A1%B0%EC%82%AC%EB%B3%84%20bios%20%EB%8B%A8%EC%B6%95%ED%82%A4%EC%99%80%20%EC%A7%84%EC%9E%85%20%EB%B0%8F%20%EB%B0%94%EC%9D%B4%EC%98%A4%EC%8A%A4%20%EB%B6%80%ED%8C%85%EC%88%9C%EC%84%9C%20%EC%84%A4%EC%A0%95%20%EB%B0%A9%EB%B2%95%20-%20%EC%98%81%EC%83%81%EB%8F%84%20%ED%95%A8%EA%BB%98%22%2C%20%22description%22%3A%20%22%EB%B8%8C%EB%9E%9C%EB%93%9C%20%EB%B0%8F%20%EC%A0%9C%EC%A1%B0%EC%82%AC%EB%B3%84%20%EB%B0%94%EC%9D%B4%EC%98%A4%EC%8A%A4%28bios%29%20%EB%8B%A8%EC%B6%95%ED%82%A4%EC%99%80%20%EC%8B%A4%ED%96%89%EC%95%88%EB%85%95%ED%95%98%EC%84%B8%EC%9A%94.%20%EB%82%98%EC%9D%B4%EC%8A%A4%EC%AA%BC%20%EC%9E%85%EB%8B%88%EB%8B%A4.%20%EB%A7%8E%EC%9D%80%20%EB%B6%84%EB%93%A4%EA%BB%98%EC%84%9C%20%ED%8F%AC%EB%A7%B7%EC%9D%84%20%EC%9C%84...%22%7D")](<https://blog.naver.com/tmdcjfdl3/221366662549>)
