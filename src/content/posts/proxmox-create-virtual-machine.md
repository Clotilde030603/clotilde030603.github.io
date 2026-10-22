---
title: "03. Proxmox 가상머신 생성"
date: 2024-06-03
summary: "Proxmox에서 가상머신을 생성하고 기본 설정을 진행하는 과정을 정리합니다."
category: "개발/서버·가상화"
tags: []
sourceUrl: "https://learntoflyclotilde.tistory.com/entry/Proxmox-%EA%B0%80%EC%83%81%EB%A8%B8%EC%8B%A0-%EC%83%9D%EC%84%B1"
draft: false
---

## **생성 방법**
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

## **Ubuntu-Server 설정 방법**
1. 분투 설치 시 생성한 계정으로 로그인
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

8.[http://kr.archive.ubuntu.com/ubuntu/](http://kr.archive.ubuntu.com/ubuntu/)를[https://mirror.kakao.com/ubuntu/](https://mirror.kakao.com/ubuntu/)(카카오 미러 사이트)로 변경
*카카오 미러사이트로 변경해주면, 속도가 빨라짐.
*Ubuntu 24.04 /etc/apt/sources.list가 아닌/etc/apt/sources.list.d/ubuntu.sources로 경로 변경.
---

## **참고 자료**

리눅스/Linux (우분투/Ubuntu) 설치하기
우선 리눅스를 설치하기전에 리눅스가 뭔지는 알아야한다. 리눅스는 고급언어(사용자가 이해하기 쉬운 언어) 로 개발된 최초의 운영체제(OS)이다. 게다가 오픈소스 (방대한 라이브러리) 그리고
taehoung0102.tistory.com

Proxmox 가상머신 생성
VM 생성은 3가지 위치에서 확인할 수 있다. 1. 관리페이지 우상단의 \[VM 생성\] 2. \[데이터 센터\]-\[노드명\] 우클릭 후 \[VM 생성\] 3, \[데이터 센터\]-\[찾기\]-\[노드명\] 우클릭 후 \[VM 생성\] 가상머신 \[이름\] 설
syweblog.tistory.com

Proxmox에 저장공간 추가하기 1 (LVM - 1개 디스크 추가)
Proxmox에 접속하여 로그인한 후 pve – Shell의 아래 화살표 버튼을 클릭합니다. xterms.js를 클릭합니...
blog.naver.com

\[Linux\] Ubuntu 20.04 server 설치 과정
Ubuntu 20.04 버전을 설치하는 과정을 담았습니다. Ubuntu 20.04 다운로드 및 설치 https://ubuntu.com/download/server Get Ubuntu Server | Download | Ubuntu Get Ubuntu Server one of three ways; by using Multipass on your desktop, using MAAS
heroeswillnotdie.tistory.com

\[Ubuntu\] 우분투 root 초기 비밀번호 설정하기 (맨 처음엔 원래 없어요~ )
우분투 root 초기 비밀번호 설정하기 맨 처음엔 root 비밀번호가 원래 없어요~ 당황하지 말고 아래처럼 따라해보세요 ! (* 현재 우분투 18.04.6 버전으로 설치한 상태입니다!) 1. 먼저 우분투 설치
coding-nurse.tistory.com

우분투 24 apt 저장소 (소스) 변경하기
우분투 24.04를 처음 사용해보고 있는데, 나는 항상 카카오 미러로 apt 저장소를 옮겨주는 편이라 평소처럼 /etc/apt/sources.list 파일을 열었더니… # Ubuntu sources have moved to the /etc/apt/sources.list.d/ubuntu.so
wiki.doda.dev

\[ubuntu\] 업데이트 설정하기! (카카오 미러사이트로 변경)
ubuntu에서 업데이트를 할때 가끔 느릴때가 있습니다. 어떨땐 뭔가 update가 안되어 error가 뜰때가 있습니다. (한국판 우분투랑 충돌이 있을수가 있습니다.) 해결방법!!을 간단하게 정리해보도록 하
mopipe.tistory.com

VMware 로 칼리 리눅스 (Kali Linux) 설치하기 + 한글 깨짐 해결
먼저, 칼리 리눅스를 설치하는 방법도 결국 가상 머신을 설치하는 방법과 같기에 이전에 가상 머신을 설치해 보셨다면 그와 비슷하게 설치하시면 됩니다. 가상머신을 설치하는 과정은 다음과
iforint.tistory.com
