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

1. [Rufus 사이트](<https://rufus.ie/ko/#google_vignette>)에서 rufus-4.3.exe를 다운
(단, Windows 8 이상. 다운로드만 하면 바로 사용할 수 있음)

2. 다운로드한 실행 파일을 설치 → 실행

3. [PROXMOX 다운로드 사이트](<https://www.proxmox.com/en/downloads>)에서 proxmox-ve_8.1-1.iso 이미지 파일 다운
※ Rufus 버전 1.1.0 이상에서는 ISO 이미지(.iso)로부터 부팅 가능한 USB 드라이브를 만들 수 있음

4. USB를 현재 컴퓨터에 연결 → 설치한 Rufus를 실행

5. 아래 사진에서 선택

![01. Rufus 설치(부팅용 USB) 및 사용 이미지 1](/assets/posts/rufus-bootable-usb/image-01.png)

6. 앞서 다운로드한 ISO 이미지 파일을 찾아 선택 → 열기

7. 이미지 보기 모드 안내 메세지 확인

8. 이미지에 맞춰 자동으로 기본 구성이 적용되니 문제 없으면 시작

9. 팝업 창 확인 및 쓰기 작업 진행

10. 부팅 디스크 생성이 모두 완료되면 창 닫고 종료

---

## **참고 자료**

[![Link preview](/assets/posts/rufus-bootable-usb/link-preview-01.png "dorami-card:%7B%22title%22%3A%20%22Rufus%20-%20%EA%B0%84%ED%8E%B8%ED%95%98%EA%B2%8C%20%EB%B6%80%ED%8C%85%20%EA%B0%80%EB%8A%A5%ED%95%9C%20USB%20%EB%93%9C%EB%9D%BC%EC%9D%B4%EB%B8%8C%20%EB%A7%8C%EB%93%A4%EA%B8%B0%22%2C%20%22description%22%3A%20%22Rufus%EB%8A%94%20USB%20%EB%A9%94%EB%AA%A8%EB%A6%AC%20%EB%B0%8F%20%ED%94%8C%EB%9E%98%EC%8B%9C%20%EB%93%9C%EB%9D%BC%EC%9D%B4%EB%B8%8C%EB%A5%BC%20%ED%8F%AC%EB%A7%B7%ED%95%98%EA%B3%A0%20%EB%B6%80%ED%8C%85%ED%95%A0%20%EC%88%98%20%EC%9E%88%EB%8F%84%EB%A1%9D%20%EB%A7%8C%EB%93%9C%EB%8A%94%20%EB%8F%84%EA%B5%AC%EC%9E%85%EB%8B%88%EB%8B%A4.%20%EC%9D%B4%20%ED%8E%98%EC%9D%B4%EC%A7%80%20%EC%95%84%EB%9E%98%EC%97%90%20%EB%82%98%EC%97%B4%EB%90%9C%20ISO%20%EC%9D%B4%EB%AF%B8%EC%A7%80%20%EC%9D%B4%EC%99%B8%EC%97%90%EB%8F%84%20Rufus%EB%8A%94%20%EC%97%AC%EB%9F%AC%20%EC%A2%85%EB%A5%98%EC%9D%98%20ISO%20%EC%9D%B4%EB%AF%B8%EC%A7%80%EB%A5%BC%20%EC%A7%80%EC%9B%90%ED%95%A9%EB%8B%88%EB%8B%A4.%20%281%29%20Windows%208%20%EC%9D%B4%22%7D")](<https://rufus.ie/ko/#google_vignette>)

[Proxmox 이미지 다운로드 및 부팅 디스크 USB 만드는 방법 - insideBOX](<https://comeinsidebox.com/how-to-create-a-proxmox-boot-disk/>)

> Proxmox VE를 사용하려면, Proxmox VE를 서버에 설치해야 합니다. 설치 과정은 ISO 파일을 다운로드하여 USB 드라이브에 복사하거나 CD/DVD에 작성하는 방식으로 진행됩니다. Rufus와 같은 도구를 사용하여
