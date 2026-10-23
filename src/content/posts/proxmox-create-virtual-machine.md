---
title: "03. Proxmox 가상머신 생성"
date: 2024-06-03
summary: "Proxmox에 디스크를 추가해 LVM-Thin 저장소를 구성하고 가상머신과 Ubuntu Server를 설정합니다."
category: "개발/서버·가상화"
tags: ["Proxmox", "가상화"]
sourceUrl: "https://learntoflyclotilde.tistory.com/entry/Proxmox-%EA%B0%80%EC%83%81%EB%A8%B8%EC%8B%A0-%EC%83%9D%EC%84%B1"
draft: false
---

## **{{color:#52643c}}생성 방법{{/color}}**

1. Proxmox에 접속하여 로그인한 후, \[노드\] - \[우측 상단 shell\] - \[xterms.js\]

   ![03. Proxmox 가상머신 생성 이미지 1](/assets/posts/proxmox-create-virtual-machine/image-01.png)

2. 아래 명령어 실행 → 현재 proxmox 시스템에 인식된 디스크 확인

   ```
   ls /dev/ | grep sd
   ```

   ![03. Proxmox 가상머신 생성 이미지 2](/assets/posts/proxmox-create-virtual-machine/image-02.png)

3. 아래 3줄의 명령어를 통해 proxmox에 디스크 추가

   ```
   pvcreate /dev/sdb1[추가할 디스크 장치명]
   vgcreate local2T[원하는 볼륨 그룹명] /dev/sdb1[추가할 디스크 장치명]
   lvcreate -l 100%FREE --thinpool thin-pool local2T[원하는 볼륨 그룹명]
   ```

4. 터미널 창 닫고, proxmox \[Datacenter\] - \[Storage\] - \[Add\] - \[LVM-Thin\]

5. ID에는 원하는 볼륨 명 입력 → Volume group에서는 생성한 볼륨 그룹명 선택 → Thin pool에서는 thin-pool 선택

6. 모두 입력 후, \[Add\]

7. 생성한 볼륨이 proxmox에서 사용 가능하도록 설정됨

8. VM 생성 시 새로운 디스크 사용 가능

9. \[Datacenter\]-\[노드명\] - 우클릭 후 \[VM 생성\]

10. 가상머신 \[이름\] 설정 - \[다음\]

11. 설치할 가상머신 OS 유형 선택

12. 설치할 부팅이미지 ISO파일 선택 후 → \[다음\]

13. 시스템, 디스크, CPU, 메모리, 네트워크 설정 → \[다음\]

14. 설정 요약내용 확인 후 → \[마침\]

15. 가상머신 시작은 해당 가상머신 선택 → \[시작\]

16. 가상머신 화면은 가상머신 선택 후, \[콘솔\] - \[출력 방식 선택\] or 가상머신 우클릭 \[콘솔\].

17. 가상 머신 화면 출력

---

## **{{color:#697d4f}}Ubuntu-Server 설정 방법{{/color}}**

1. 우분투 설치 시 생성한 계정으로 로그인

2. 터미널 접속

3. root 비밀번호를 설치하는 아래 명령어 입력

   ```

   sudo passwd root

   ```

4. 명령어 창에 아래 알림 메세지에 맞춰 비밀번호 입력

   ```

   1) [sudo] password for es[로그인한계정] :
   2) Enter new UNIX password :
   3) Retype new UNIX password :

   ```

5. 아래와 같이 root 비밀번호 설정 완료

   ```

   passwd: password updated successfully

   ```

6. 아래 명령어로 vim 설치

   ```

   sudo apt-get install vim

   ```

7. 업데이트 Source를 확인하기 위해 아래의 경로로 들어감

   ```

   /etc/apt/sources.list(/etc/apt/sources.list.d/ubuntu.sources)

   ```

8. [http://kr.archive.ubuntu.com/ubuntu/](<http://kr.archive.ubuntu.com/ubuntu/>) 를 [https://mirror.kakao.com/ubuntu/](<https://mirror.kakao.com/ubuntu/>) (카카오 미러 사이트)로 변경

   {{color:#a2645a}}*{{/color}} 카카오 미러사이트로 변경해주면, 속도가 빨라짐.

   {{color:#a2645a}}*{{/color}} Ubuntu 24.04 /etc/apt/sources.list가 아닌  /etc/apt/sources.list.d/ubuntu.sources로 경로 변경.

---

## **{{color:#52643c}}참고 자료{{/color}}**

[![Link preview](/assets/posts/proxmox-create-virtual-machine/link-preview-01.png "dorami-card:%7B%22title%22%3A%20%22%EB%A6%AC%EB%88%85%EC%8A%A4%2FLinux%20%28%EC%9A%B0%EB%B6%84%ED%88%AC%2FUbuntu%29%20%EC%84%A4%EC%B9%98%ED%95%98%EA%B8%B0%22%2C%20%22description%22%3A%20%22%EC%9A%B0%EC%84%A0%20%EB%A6%AC%EB%88%85%EC%8A%A4%EB%A5%BC%20%EC%84%A4%EC%B9%98%ED%95%98%EA%B8%B0%EC%A0%84%EC%97%90%20%EB%A6%AC%EB%88%85%EC%8A%A4%EA%B0%80%20%EB%AD%94%EC%A7%80%EB%8A%94%20%EC%95%8C%EC%95%84%EC%95%BC%ED%95%9C%EB%8B%A4.%20%EB%A6%AC%EB%88%85%EC%8A%A4%EB%8A%94%20%EA%B3%A0%EA%B8%89%EC%96%B8%EC%96%B4%28%EC%82%AC%EC%9A%A9%EC%9E%90%EA%B0%80%20%EC%9D%B4%ED%95%B4%ED%95%98%EA%B8%B0%20%EC%89%AC%EC%9A%B4%20%EC%96%B8%EC%96%B4%29%20%EB%A1%9C%20%EA%B0%9C%EB%B0%9C%EB%90%9C%20%EC%B5%9C%EC%B4%88%EC%9D%98%20%EC%9A%B4%EC%98%81%EC%B2%B4%EC%A0%9C%28OS%29%EC%9D%B4%EB%8B%A4.%20%EA%B2%8C%EB%8B%A4%EA%B0%80%20%EC%98%A4%ED%94%88%EC%86%8C%EC%8A%A4%20%28%EB%B0%A9%EB%8C%80%ED%95%9C%20%EB%9D%BC%EC%9D%B4%EB%B8%8C%EB%9F%AC%EB%A6%AC%29%20%EA%B7%B8%EB%A6%AC%EA%B3%A0%22%7D")](<https://taehoung0102.tistory.com/171>)

[![Link preview](/assets/posts/proxmox-create-virtual-machine/link-preview-02.png "dorami-card:%7B%22title%22%3A%20%22Proxmox%20%EA%B0%80%EC%83%81%EB%A8%B8%EC%8B%A0%20%EC%83%9D%EC%84%B1%22%2C%20%22description%22%3A%20%22VM%20%EC%83%9D%EC%84%B1%EC%9D%80%203%EA%B0%80%EC%A7%80%20%EC%9C%84%EC%B9%98%EC%97%90%EC%84%9C%20%ED%99%95%EC%9D%B8%ED%95%A0%20%EC%88%98%20%EC%9E%88%EB%8B%A4.%201.%20%EA%B4%80%EB%A6%AC%ED%8E%98%EC%9D%B4%EC%A7%80%20%EC%9A%B0%EC%83%81%EB%8B%A8%EC%9D%98%20%5BVM%20%EC%83%9D%EC%84%B1%5D%202.%20%5B%EB%8D%B0%EC%9D%B4%ED%84%B0%20%EC%84%BC%ED%84%B0%5D-%5B%EB%85%B8%EB%93%9C%EB%AA%85%5D%20%EC%9A%B0%ED%81%B4%EB%A6%AD%20%ED%9B%84%20%5BVM%20%EC%83%9D%EC%84%B1%5D%203%2C%20%5B%EB%8D%B0%EC%9D%B4%ED%84%B0%20%EC%84%BC%ED%84%B0%5D-%5B%EC%B0%BE%EA%B8%B0%5D-%5B%EB%85%B8%EB%93%9C%EB%AA%85%5D%20%EC%9A%B0%ED%81%B4%EB%A6%AD%20%ED%9B%84%20%5BVM%20%EC%83%9D%EC%84%B1%5D%20%EA%B0%80%EC%83%81%EB%A8%B8%EC%8B%A0%20%5B%EC%9D%B4%EB%A6%84%5D%20%EC%84%A4%22%7D")](<https://syweblog.tistory.com/17>)

[![Link preview](/assets/posts/proxmox-create-virtual-machine/link-preview-03.jpg "dorami-card:%7B%22title%22%3A%20%22Proxmox%EC%97%90%20%EC%A0%80%EC%9E%A5%EA%B3%B5%EA%B0%84%20%EC%B6%94%EA%B0%80%ED%95%98%EA%B8%B0%201%20%28LVM%20-%201%EA%B0%9C%20%EB%94%94%EC%8A%A4%ED%81%AC%20%EC%B6%94%EA%B0%80%29%22%2C%20%22description%22%3A%20%22Proxmox%EC%97%90%20%EC%A0%91%EC%86%8D%ED%95%98%EC%97%AC%20%EB%A1%9C%EA%B7%B8%EC%9D%B8%ED%95%9C%20%ED%9B%84%20pve%20%E2%80%93%20Shell%EC%9D%98%20%EC%95%84%EB%9E%98%20%ED%99%94%EC%82%B4%ED%91%9C%20%EB%B2%84%ED%8A%BC%EC%9D%84%20%ED%81%B4%EB%A6%AD%ED%95%A9%EB%8B%88%EB%8B%A4.%20xterms.js%EB%A5%BC%20%ED%81%B4%EB%A6%AD%ED%95%A9%EB%8B%88...%22%7D")](<https://blog.naver.com/17beans/222086381116>)

[![Link preview](/assets/posts/proxmox-create-virtual-machine/link-preview-04.png "dorami-card:%7B%22title%22%3A%20%22%5BLinux%5D%20Ubuntu%2020.04%20server%20%EC%84%A4%EC%B9%98%20%EA%B3%BC%EC%A0%95%22%2C%20%22description%22%3A%20%22Ubuntu%2020.04%20%EB%B2%84%EC%A0%84%EC%9D%84%20%EC%84%A4%EC%B9%98%ED%95%98%EB%8A%94%20%EA%B3%BC%EC%A0%95%EC%9D%84%20%EB%8B%B4%EC%95%98%EC%8A%B5%EB%8B%88%EB%8B%A4.%20Ubuntu%2020.04%20%EB%8B%A4%EC%9A%B4%EB%A1%9C%EB%93%9C%20%EB%B0%8F%20%EC%84%A4%EC%B9%98%20https%3A%2F%2Fubuntu.com%2Fdownload%2Fserver%20Get%20Ubuntu%20Server%20%7C%20Download%20%7C%20Ubuntu%20Get%20Ubuntu%20Server%20one%20of%20three%20ways%3B%20by%20using%20Multipass%20on%20your%20desktop%2C%20using%20MAAS%22%7D")](<https://heroeswillnotdie.tistory.com/22>)

[![Link preview](/assets/posts/proxmox-create-virtual-machine/link-preview-05.png "dorami-card:%7B%22title%22%3A%20%22%5BUbuntu%5D%20%EC%9A%B0%EB%B6%84%ED%88%AC%20root%20%EC%B4%88%EA%B8%B0%20%EB%B9%84%EB%B0%80%EB%B2%88%ED%98%B8%20%EC%84%A4%EC%A0%95%ED%95%98%EA%B8%B0%20%28%EB%A7%A8%20%EC%B2%98%EC%9D%8C%EC%97%94%20%EC%9B%90%EB%9E%98%20%EC%97%86%EC%96%B4%EC%9A%94~%20%29%22%2C%20%22description%22%3A%20%22%EC%9A%B0%EB%B6%84%ED%88%AC%20root%20%EC%B4%88%EA%B8%B0%20%EB%B9%84%EB%B0%80%EB%B2%88%ED%98%B8%20%EC%84%A4%EC%A0%95%ED%95%98%EA%B8%B0%20%EB%A7%A8%20%EC%B2%98%EC%9D%8C%EC%97%94%20root%20%EB%B9%84%EB%B0%80%EB%B2%88%ED%98%B8%EA%B0%80%20%EC%9B%90%EB%9E%98%20%EC%97%86%EC%96%B4%EC%9A%94~%20%20%EB%8B%B9%ED%99%A9%ED%95%98%EC%A7%80%20%EB%A7%90%EA%B3%A0%20%EC%95%84%EB%9E%98%EC%B2%98%EB%9F%BC%20%EB%94%B0%EB%9D%BC%ED%95%B4%EB%B3%B4%EC%84%B8%EC%9A%94%20%21%20%28%2A%20%ED%98%84%EC%9E%AC%20%EC%9A%B0%EB%B6%84%ED%88%AC%2018.04.6%20%EB%B2%84%EC%A0%84%EC%9C%BC%EB%A1%9C%20%EC%84%A4%EC%B9%98%ED%95%9C%20%EC%83%81%ED%83%9C%EC%9E%85%EB%8B%88%EB%8B%A4%21%29%201.%20%EB%A8%BC%EC%A0%80%20%EC%9A%B0%EB%B6%84%ED%88%AC%20%EC%84%A4%EC%B9%98%22%7D")](<https://coding-nurse.tistory.com/343>)

[우분투 24 apt 저장소 (소스) 변경하기](<https://wiki.doda.dev/ubuntu/24-change-apt-source>)


[![Link preview](/assets/posts/proxmox-create-virtual-machine/link-preview-06.png "dorami-card:%7B%22title%22%3A%20%22%5Bubuntu%5D%20%EC%97%85%EB%8D%B0%EC%9D%B4%ED%8A%B8%20%EC%84%A4%EC%A0%95%ED%95%98%EA%B8%B0%21%20%28%EC%B9%B4%EC%B9%B4%EC%98%A4%20%EB%AF%B8%EB%9F%AC%EC%82%AC%EC%9D%B4%ED%8A%B8%EB%A1%9C%20%EB%B3%80%EA%B2%BD%29%22%2C%20%22description%22%3A%20%22ubuntu%EC%97%90%EC%84%9C%20%EC%97%85%EB%8D%B0%EC%9D%B4%ED%8A%B8%EB%A5%BC%20%ED%95%A0%EB%95%8C%20%EA%B0%80%EB%81%94%20%EB%8A%90%EB%A6%B4%EB%95%8C%EA%B0%80%20%EC%9E%88%EC%8A%B5%EB%8B%88%EB%8B%A4.%20%EC%96%B4%EB%96%A8%EB%95%90%20%EB%AD%94%EA%B0%80%20update%EA%B0%80%20%EC%95%88%EB%90%98%EC%96%B4%20error%EA%B0%80%20%EB%9C%B0%EB%95%8C%EA%B0%80%20%EC%9E%88%EC%8A%B5%EB%8B%88%EB%8B%A4.%20%28%ED%95%9C%EA%B5%AD%ED%8C%90%20%EC%9A%B0%EB%B6%84%ED%88%AC%EB%9E%91%20%EC%B6%A9%EB%8F%8C%EC%9D%B4%20%EC%9E%88%EC%9D%84%EC%88%98%EA%B0%80%20%EC%9E%88%EC%8A%B5%EB%8B%88%EB%8B%A4.%29%20%ED%95%B4%EA%B2%B0%EB%B0%A9%EB%B2%95%21%21%EC%9D%84%20%EA%B0%84%EB%8B%A8%ED%95%98%EA%B2%8C%20%EC%A0%95%EB%A6%AC%ED%95%B4%EB%B3%B4%EB%8F%84%EB%A1%9D%20%ED%95%98%22%7D")](<https://mopipe.tistory.com/120>)

[![Link preview](/assets/posts/proxmox-create-virtual-machine/link-preview-07.png "dorami-card:%7B%22title%22%3A%20%22VMware%20%EB%A1%9C%20%EC%B9%BC%EB%A6%AC%20%EB%A6%AC%EB%88%85%EC%8A%A4%20%28Kali%20Linux%29%20%EC%84%A4%EC%B9%98%ED%95%98%EA%B8%B0%20%2B%20%ED%95%9C%EA%B8%80%20%EA%B9%A8%EC%A7%90%20%ED%95%B4%EA%B2%B0%22%2C%20%22description%22%3A%20%22%EB%A8%BC%EC%A0%80%2C%20%EC%B9%BC%EB%A6%AC%20%EB%A6%AC%EB%88%85%EC%8A%A4%EB%A5%BC%20%EC%84%A4%EC%B9%98%ED%95%98%EB%8A%94%20%EB%B0%A9%EB%B2%95%EB%8F%84%20%EA%B2%B0%EA%B5%AD%20%EA%B0%80%EC%83%81%20%EB%A8%B8%EC%8B%A0%EC%9D%84%20%EC%84%A4%EC%B9%98%ED%95%98%EB%8A%94%20%EB%B0%A9%EB%B2%95%EA%B3%BC%20%EA%B0%99%EA%B8%B0%EC%97%90%20%EC%9D%B4%EC%A0%84%EC%97%90%20%EA%B0%80%EC%83%81%20%EB%A8%B8%EC%8B%A0%EC%9D%84%20%EC%84%A4%EC%B9%98%ED%95%B4%20%EB%B3%B4%EC%85%A8%EB%8B%A4%EB%A9%B4%20%EA%B7%B8%EC%99%80%20%EB%B9%84%EC%8A%B7%ED%95%98%EA%B2%8C%20%EC%84%A4%EC%B9%98%ED%95%98%EC%8B%9C%EB%A9%B4%20%EB%90%A9%EB%8B%88%EB%8B%A4.%20%EA%B0%80%EC%83%81%EB%A8%B8%EC%8B%A0%EC%9D%84%20%EC%84%A4%EC%B9%98%ED%95%98%EB%8A%94%20%EA%B3%BC%EC%A0%95%EC%9D%80%20%EB%8B%A4%EC%9D%8C%EA%B3%BC%22%7D")](<https://iforint.tistory.com/147>)
