---
title: "Raspberry Pi 4 OS 설치"
date: 2025-01-22T16:13:35+09:00
summary: "Raspberry Pi Imager로 OS를 설치하고 SSH와 Wi-Fi를 설정해 Raspberry Pi 4를 부팅합니다."
category: "개발/IoT·Raspberry Pi"
tags: ["Raspberry Pi", "OS 설치"]
sourceUrl: "https://learntoflyclotilde.tistory.com/entry/Raspberry-Pi-4-OS-%EC%84%A4%EC%B9%98"
draft: false
---

## **{{color:#52643c}}IoT 및  {{/color}}{{color:#697d4f}}Raspberry Pi 4 setting 준비물{{/color}}**

- SD 카드와 리더기

- Raspberry Pi 4 - 4GB 메모리

- Raspberry Pi 4 전원 케이블(5V 3A, C-type)

- 모니터 연결 용 마이크로 HDMI 케이블

- Raspberry Pi Imager

---

## **{{color:#52643c}}설치 방법{{/color}}**

1. **아래 링크 접속.**

   [![Link preview](/assets/posts/raspberry-pi-4-os-installation/link-preview-01.jpg "dorami-card:%7B%22title%22%3A%20%22Teach%2C%20learn%2C%20and%20make%20with%20the%20Raspberry%20Pi%20Foundation%22%2C%20%22description%22%3A%20%22We%20are%20a%20charity%20with%20the%20mission%20to%20enable%20young%20people%20to%20realise%20their%20full%20potential%20through%20the%20power%20of%20computing%20and%20digital%20technologies.%22%7D")](<https://www.raspberrypi.org/>)

2. **초기 화면 → Computers → Software 선택.**

3. **Raspberry Pi Imager (Download for Windows) 다운.**

4. **다운로드 후, 해당 프로그램 실행.**

5. **장치 선택 - Raspberry Pi 4/운영체제 선택 - Raspberry Pi OS(64-bit)/저장소 선택 - SD 카드 선택.**

6. **Write 실행 전, 설정을 선택하여 기본 값 설정.**

   1. **SSH 사용 선택.**

   2. **사용자 이름: ppojjacki(본인 이름 설정), 비밀번호 설정.**

   3. **WIFI 설정 선택(PC의 WIFI가 그대로 이전되어 화면에 보임).**

   4. **Wireless Lan Country ‘GB’ 선택.**

   5. **로컬 선택: 타임 존은 ‘Asia Seoul’ 선택, 키보드는 ‘US’ 선택.**

   6. **설정 후, Write를 실행하면 OS가 SD카드에 설치 완료.**

7. **OS가 설치된 SD 메모리 카드를 Raspberry Pi의 SD카드에 끼운 후, 부팅.**

---

## **{{color:#52643c}}Trouble Shooting{{/color}}**

- {{color:#a2645a}}Problem : 부팅 후, 본인은 internet 문제로 ssh 연결 오류가 발생.{{/color}}

- {{color:#52643c}}Troubleshooting : Cert팀 WIFI를 이용하여 ssh 연결이 정상적으로 실행이 됨을 확인.{{/color}}

---

## **{{color:#52643c}}참고 자료{{/color}}**

[![Link preview](/assets/posts/raspberry-pi-4-os-installation/link-preview-02.png "dorami-card:%7B%22title%22%3A%20%22%EC%B5%9C%EC%8B%A0%20%EB%9D%BC%EC%A6%88%EB%B2%A0%EB%A6%AC%ED%8C%8C%EC%9D%B4%28Raspberry%204%29%20OS%20%EC%97%90%EB%9F%AC%EC%97%86%EC%9D%B4%20%EC%84%A4%EC%B9%98%ED%95%98%EA%B8%B0%22%2C%20%22description%22%3A%20%22%EB%9D%BC%EC%A6%88%EB%B2%A0%EB%A6%AC%ED%8C%8C%EC%9D%B4%28Raspberry%29%EB%8A%94%20%EC%A0%80%EB%A0%B4%ED%95%9C%20%EA%B0%80%EA%B2%A9%EA%B3%BC%20%EC%86%8C%ED%98%95%EC%9D%98%20%ED%81%AC%EA%B8%B0%EB%A1%9C%20%EB%88%84%EA%B5%AC%EB%82%98%20%EC%89%BD%EA%B2%8C%20%EC%A0%91%EA%B7%BC%ED%95%A0%20%EC%88%98%20%EC%9E%88%EC%96%B4%EC%84%9C%20%ED%95%99%EA%B5%90%EB%BF%90%EB%A7%8C%20%EC%95%84%EB%8B%88%EB%9D%BC%20%EC%82%B0%EC%97%85%EA%B3%84%EC%9D%98%20%EB%8B%A4%EC%96%91%ED%95%9C%20%EB%B6%84%EC%95%BC%EC%97%90%EC%84%9C%20%EC%82%AC%EC%9A%A9%EB%90%98%EA%B3%A0%20%EC%9E%88%EC%8A%B5%EB%8B%88%EB%8B%A4.%20%EB%9D%BC%EC%A6%88%EB%B2%A0%EB%A6%AC%ED%8C%8C%EC%9D%B4%204%EC%97%90%20%EC%B5%9C%EC%8B%A0%20%EB%9D%BC%EC%A6%88%EB%B2%A0%EB%A6%AC%20OS%EB%A5%BC%20%EC%84%A4%EC%B9%98%22%7D")](<https://humber.tistory.com/entry/%EC%B5%9C%EC%8B%A0-%EB%9D%BC%EC%A6%88%EB%B2%A0%EB%A6%AC%ED%8C%8C%EC%9D%B4Raspberry-4-OS-%EC%97%90%EB%9F%AC%EC%97%86%EC%9D%B4-%EC%84%A4%EC%B9%98%ED%95%98%EA%B8%B0>)

[![Link preview](/assets/posts/raspberry-pi-4-os-installation/link-preview-03.jpg "dorami-card:%7B%22title%22%3A%20%22Teach%2C%20learn%2C%20and%20make%20with%20the%20Raspberry%20Pi%20Foundation%22%2C%20%22description%22%3A%20%22We%20are%20a%20charity%20with%20the%20mission%20to%20enable%20young%20people%20to%20realise%20their%20full%20potential%20through%20the%20power%20of%20computing%20and%20digital%20technologies.%22%7D")](<https://www.raspberrypi.org/>)

[![Link preview](/assets/posts/raspberry-pi-4-os-installation/link-preview-04.png "dorami-card:%7B%22title%22%3A%20%22%EB%9D%BC%EC%A6%88%EB%B2%A0%EB%A6%AC%ED%8C%8C%EC%9D%B4%20SSH%20%EC%97%B0%EA%B2%B0%22%2C%20%22description%22%3A%20%22%EA%B0%9C%EB%B0%9C%ED%99%98%EA%B2%BD%20%EB%AA%A8%EB%8B%88%ED%84%B0%2C%20%ED%82%A4%EB%B3%B4%EB%93%9C%20%EC%97%86%EC%9D%B4%20%EB%9D%BC%EC%A6%88%EB%B2%A0%EB%A6%AC%ED%8C%8C%EC%9D%B4%20%EC%84%B8%ED%8C%85%ED%95%98%EA%B8%B0%20%EC%9A%B0%EC%84%A0%20%EC%9B%90%EA%B2%A9%20%EC%A0%91%EC%86%8D%28SSH%29%EB%A5%BC%20%ED%95%B4%EC%95%BC%20%ED%95%98%EB%AF%80%EB%A1%9C%20%EA%B8%B0%EB%B3%B8%EC%9C%BC%EB%A1%9C%20%EC%97%B0%EA%B2%B0%ED%95%A0%20%EC%99%80%EC%9D%B4%ED%8C%8C%EC%9D%B4%EB%A5%BC%20%EC%A7%80%EC%A0%95%ED%95%B4%EC%95%BC%20%ED%95%9C%EB%8B%A4.%20%EC%84%A4%EC%A0%95%20%ED%8C%8C%EC%9D%BC%20%EC%A7%81%EC%A0%91%20%EC%9E%91%EC%84%B1%20%EB%AA%A8%EB%8B%88%ED%84%B0%20%EC%97%86%EC%9D%B4~%20%EB%A1%9C%20%EA%B2%80%EC%83%89%ED%95%98%EB%A9%B4%20%EA%B5%89%EC%9E%A5%ED%9E%88%20%EB%A7%8E%22%7D")](<https://velog.io/@zero-black/%EB%9D%BC%EC%A6%88%EB%B2%A0%EB%A6%AC%ED%8C%8C%EC%9D%B4-SSH-%EC%97%B0%EA%B2%B0>)

[![Link preview](/assets/posts/raspberry-pi-4-os-installation/link-preview-05.png "dorami-card:%7B%22title%22%3A%20%22%5BRaspberry%20%20Pi%5D%20%EB%AA%A8%EB%8B%88%ED%84%B0%20%EC%97%86%EC%9D%B4%20Ubuntu%2022.04%20LTS%20%EC%84%A4%EC%B9%98%ED%95%98%EA%B8%B0%20%28Raspberry%20Pi%20Imager%29%22%2C%20%22description%22%3A%20%22Raspberry%20Pi%EC%97%90%20%EB%B3%84%EB%8F%84%EC%9D%98%20%EB%AA%A8%EB%8B%88%ED%84%B0%20%EC%97%86%EC%9D%B4%20Ubuntu%20%EB%A5%BC%20%EC%84%A4%EC%B9%98%ED%95%9C%EB%8B%A4.%20%EC%A4%80%EB%B9%84%EB%AC%BC%201.%20Raspberry%20Pi%204B%204GB%202.%20Micro%20SD%20%EC%B9%B4%EB%93%9C%20%2B%20%EC%B9%B4%EB%93%9C%20%EB%A6%AC%EB%8D%94%EA%B8%B0%203.%20Pi%20Imager%204.%20%EC%BB%B4%ED%93%A8%ED%84%B0%205.%20wifi%20%2B%20wifi%20%EA%B3%B5%EC%9C%A0%EA%B8%B0%20Ubuntu%20%EC%9D%B4%EB%AF%B8%EC%A7%80%20%EB%8B%A4%EC%9A%B4%EB%A1%9C%EB%93%9C%20%28Pi%20Imager%20%EC%82%AC%EC%9A%A9%29%201.%20Raspberry%20Pi%20I%22%7D")](<https://main.tistory.com/278>)
