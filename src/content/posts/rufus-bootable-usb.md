---
title: "01. Rufus 설치(부팅용 USB) 및 사용"
date: 2024-05-20
summary: "Rufus를 설치하고 부팅용 USB를 만드는 과정을 정리합니다."
category: "개발/서버·가상화"
tags: []
sourceUrl: "https://learntoflyclotilde.tistory.com/entry/1-Rufus-%EC%84%A4%EC%B9%98%EB%B6%80%ED%8C%85%EC%9A%A9-USB-%EB%B0%8F-%EC%82%AC%EC%9A%A9"
draft: false
---

## **Rufus**
- Rufus는 USB 메모리 및 플래시 드라이브를 포맷하고 부팅할 수 있도록 만드는 도구
- 이 프로그램은 다음 상황에서 유용하게 사용  
- 부팅 가능한 ISO 파일(Windows, Linux, UEFI 등)을 USB로 설치해야 할 때  
- OS가 설치되지 않은 시스템에서 작업해야할 때  
- DOS 환경에서 BIOS나 기타 펌웨어를 설치해야 할 때  
- 로우포맷 유틸리티를 실행해야 할 때

---

## **설치 방법**
2. [Rufus 사이트](https://rufus.ie/ko/#google_vignette)에서 rufus-4.3.exe를 다운  
(단, Windows 8 이상. 다운로드만 하면 바로 사용할 수 있음)
4. 다운로드한 실행 파일을 설치 → 실행
6. [PROXMOX 다운로드 사이트](https://www.proxmox.com/en/downloads)에서 proxmox-ve_8.1-1.iso 이미지 파일 다운  
※ Rufus 버전 1.1.0 이상에서는 ISO 이미지(.iso)로부터 부팅 가능한 USB 드라이브를 만들 수 있음
8. USB를 현재 컴퓨터에 연결 → 설치한 Rufus를 실행
10. 아래 사진에서 선택

![01. Rufus 설치(부팅용 USB) 및 사용 이미지 1](/assets/posts/rufus-bootable-usb/image-01.png)

6. 앞서 다운로드한 ISO 이미지 파일을 찾아 선택 → 열기
7. 이미지 보기 모드 안내 메세지 확인
8. 이미지에 맞춰 자동으로 기본 구성이 적용되니 문제 없으면 시작
9. 팝업 창 확인 및 쓰기 작업 진행
10. 부팅 디스크 생성이 모두 완료되면 창 닫고 종료
---

## **참고 자료**

Rufus - 간편하게 부팅 가능한 USB 드라이브 만들기
Rufus는 USB 메모리 및 플래시 드라이브를 포맷하고 부팅할 수 있도록 만드는 도구입니다. 이 페이지 아래에 나열된 ISO 이미지 이외에도 Rufus는 여러 종류의 ISO 이미지를 지원합니다. (1) Windows 8 이
rufus.ie

Proxmox 이미지 다운로드 및 부팅 디스크 USB 만드는 방법 - insideBOX
Proxmox VE를 사용하려면, Proxmox VE를 서버에 설치해야 합니다. 설치 과정은 ISO 파일을 다운로드하여 USB 드라이브에 복사하거나 CD/DVD에 작성하는 방식으로 진행됩니다. Rufus와 같은 도구를 사용하여
comeinsidebox.com
