---
title: "Flask 설치"
date: 2025-01-22
summary: "Python 환경에서 Flask를 설치하고 개발 환경을 준비하는 방법입니다."
category: "개발/IoT·Raspberry Pi"
tags: []
sourceUrl: "https://learntoflyclotilde.tistory.com/entry/Flask-%EC%84%A4%EC%B9%98"
draft: false
---

## **설치 방법**
**1. 리눅스 update, upgrade 실행(순서대로).**
```
$ sudo apt-get update
$ sudo apt-get upgrade
```

**2. Python 버전 확인.**
```
$ python --version
```

**3. flask 패키지 설치.**
```
$ pip install flask
```

**4. flask 설치 완료.**
**5. vim 설치(편리성을 위해).**
```
$ apt-get update 
$ apt-get upgrade
$ apt-get install vim
```

**6. jinja2 설치.**
```
$ pip3 install jinja2
```

---

## **Trouble Shooting**
- Problem : flask 설치 시,error: externally-managed-environment발생. →이 오류는 pip가 가상 환경 외부에 설치되고 마커 파일 EXTERNALLY-MANAGED가 Python의 stdlib 디렉터리에 존재할 때 발생.
- Troubleshooting : 아래 명령어로 해결

```
$ sudo rm /usr/lib/python3.11/EXTERNALLY-MANAGED
```

---

## **참고 자료**

리눅스\[Linux\] 우분투\[Ubuntu\] 업그레이드 하기,apt-get update와 apt-get upgrade의 차이
리눅스\[Linux\] 우분투\[Ubuntu\] 업그레이드 하기, update와 upgrade의 차이 이번 포스팅은 우분투\[Ubuntu\]을 잘 사용하기 위해서 업그레이드 하는 방법에 대해서 설명을 하도록 하겠습니다. 그리고 우분투\[u
appia.tistory.com

\[python\] Flask로 서버 실행하기
파이썬으로 쓰인 웹 프레임워크로, 서버를 구동하는 데 필요한 기능을 제공한다.Flask 서버를 만들 때는 항상static 폴더, templates 폴더, app.py 파일을 만들고 시작한다.flask 서버를 돌리는 파일의 이
velog.io

error: externally-managed-environment 문제 해결
다음 명령어 입력시 해결 가능
velog.io

\[Linux\] vi에디터 명령어 정리 (설치방법, 사용법)
리눅스 환경에서 vi 에디터는 아주 유용하게 사용되는 텍스트 에디터입니다. 기존 윈도우 환경에서 사용하는 에디터와 많이 다르기 때문에 처음에 적응하는것이 힘들지만 익혀두시는 것이 좋다
good-coding.tistory.com

\[Linux\] vi 편집기 명령어 정리하기
vi 명령어는 Linux, Unix에서 사용되는 편집기를 사용하는 명령어다. vi 편집기에 대해서 살펴보도록 하자 vi 편집기는 총 3가지의 명령모드, 입력모드, 마지막 행모드로 구성되어 있다. 먼저 이 vi 편
potato-yong.tistory.com

Python Flask Jinja2 템플릿 사용하기
파이썬 관련 포스팅 목록 더보기 \[Python\] Flask 엔드포인트 설정하기(Endpoint) \[Python\] Flask 웹 서버 구축하기 - 2(Linux Ubuntu 16.04 Flask Web Server) \[Python\] Flask 웹 서버 구축하기 - 1(Linux Ubuntu 16.04 Flask Web Server
salguworld.tistory.com
