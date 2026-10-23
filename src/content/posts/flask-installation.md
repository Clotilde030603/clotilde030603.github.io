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

- Problem : flask 설치 시,  error: externally-managed-environment 발생. → 이 오류는 pip가 가상 환경 외부에 설치되고 마커 파일 EXTERNALLY-MANAGED가 Python의 stdlib 디렉터리에 존재할 때 발생.

- Troubleshooting : 아래 명령어로 해결

```

$ sudo rm /usr/lib/python3.11/EXTERNALLY-MANAGED

```

---

## **참고 자료**

[![Link preview](/assets/posts/flask-installation/link-preview-01.png "dorami-card:%7B%22title%22%3A%20%22%EB%A6%AC%EB%88%85%EC%8A%A4%5BLinux%5D%20%EC%9A%B0%EB%B6%84%ED%88%AC%5BUbuntu%5D%20%EC%97%85%EA%B7%B8%EB%A0%88%EC%9D%B4%EB%93%9C%20%ED%95%98%EA%B8%B0%2Capt-get%20update%EC%99%80%20apt-get%20upgrade%EC%9D%98%20%EC%B0%A8%EC%9D%B4%22%2C%20%22description%22%3A%20%22%EB%A6%AC%EB%88%85%EC%8A%A4%5BLinux%5D%20%EC%9A%B0%EB%B6%84%ED%88%AC%5BUbuntu%5D%20%EC%97%85%EA%B7%B8%EB%A0%88%EC%9D%B4%EB%93%9C%20%ED%95%98%EA%B8%B0%2C%20update%EC%99%80%20upgrade%EC%9D%98%20%EC%B0%A8%EC%9D%B4%20%EC%9D%B4%EB%B2%88%20%ED%8F%AC%EC%8A%A4%ED%8C%85%EC%9D%80%20%EC%9A%B0%EB%B6%84%ED%88%AC%5BUbuntu%5D%EC%9D%84%20%EC%9E%98%20%EC%82%AC%EC%9A%A9%ED%95%98%EA%B8%B0%20%EC%9C%84%ED%95%B4%EC%84%9C%20%EC%97%85%EA%B7%B8%EB%A0%88%EC%9D%B4%EB%93%9C%20%ED%95%98%EB%8A%94%20%EB%B0%A9%EB%B2%95%EC%97%90%20%EB%8C%80%ED%95%B4%EC%84%9C%20%EC%84%A4%EB%AA%85%EC%9D%84%20%ED%95%98%EB%8F%84%EB%A1%9D%20%ED%95%98%EA%B2%A0%EC%8A%B5%EB%8B%88%EB%8B%A4.%20%EA%B7%B8%EB%A6%AC%EA%B3%A0%20%EC%9A%B0%EB%B6%84%ED%88%AC%5Bu%22%7D")](<https://appia.tistory.com/268>)

[![Link preview](/assets/posts/flask-installation/link-preview-02.png "dorami-card:%7B%22title%22%3A%20%22%5Bpython%5D%20Flask%EB%A1%9C%20%EC%84%9C%EB%B2%84%20%EC%8B%A4%ED%96%89%ED%95%98%EA%B8%B0%22%2C%20%22description%22%3A%20%22%ED%8C%8C%EC%9D%B4%EC%8D%AC%EC%9C%BC%EB%A1%9C%20%EC%93%B0%EC%9D%B8%20%EC%9B%B9%20%ED%94%84%EB%A0%88%EC%9E%84%EC%9B%8C%ED%81%AC%EB%A1%9C%2C%20%EC%84%9C%EB%B2%84%EB%A5%BC%20%EA%B5%AC%EB%8F%99%ED%95%98%EB%8A%94%20%EB%8D%B0%20%ED%95%84%EC%9A%94%ED%95%9C%20%EA%B8%B0%EB%8A%A5%EC%9D%84%20%EC%A0%9C%EA%B3%B5%ED%95%9C%EB%8B%A4.Flask%20%EC%84%9C%EB%B2%84%EB%A5%BC%20%EB%A7%8C%EB%93%A4%20%EB%95%8C%EB%8A%94%20%ED%95%AD%EC%83%81static%20%ED%8F%B4%EB%8D%94%2C%20templates%20%ED%8F%B4%EB%8D%94%2C%20app.py%20%ED%8C%8C%EC%9D%BC%EC%9D%84%20%EB%A7%8C%EB%93%A4%EA%B3%A0%20%EC%8B%9C%EC%9E%91%ED%95%9C%EB%8B%A4.flask%20%EC%84%9C%EB%B2%84%EB%A5%BC%20%EB%8F%8C%EB%A6%AC%EB%8A%94%20%ED%8C%8C%EC%9D%BC%EC%9D%98%20%EC%9D%B4%22%7D")](<https://velog.io/@e_juhee/python-Flask>)

[![Link preview](/assets/posts/flask-installation/link-preview-03.png "dorami-card:%7B%22title%22%3A%20%22error%3A%20externally-managed-environment%20%EB%AC%B8%EC%A0%9C%20%ED%95%B4%EA%B2%B0%22%2C%20%22description%22%3A%20%22%EB%8B%A4%EC%9D%8C%20%EB%AA%85%EB%A0%B9%EC%96%B4%20%EC%9E%85%EB%A0%A5%EC%8B%9C%20%ED%95%B4%EA%B2%B0%20%EA%B0%80%EB%8A%A5%22%7D")](<https://velog.io/@dongju101/error-externally-managed-environment-%EB%AC%B8%EC%A0%9C-%ED%95%B4%EA%B2%B0>)


[![Link preview](/assets/posts/flask-installation/link-preview-05.png "dorami-card:%7B%22title%22%3A%20%22%5BLinux%5D%20vi%20%ED%8E%B8%EC%A7%91%EA%B8%B0%20%EB%AA%85%EB%A0%B9%EC%96%B4%20%EC%A0%95%EB%A6%AC%ED%95%98%EA%B8%B0%22%2C%20%22description%22%3A%20%22vi%20%EB%AA%85%EB%A0%B9%EC%96%B4%EB%8A%94%20Linux%2C%20Unix%EC%97%90%EC%84%9C%20%EC%82%AC%EC%9A%A9%EB%90%98%EB%8A%94%20%ED%8E%B8%EC%A7%91%EA%B8%B0%EB%A5%BC%20%EC%82%AC%EC%9A%A9%ED%95%98%EB%8A%94%20%EB%AA%85%EB%A0%B9%EC%96%B4%EB%8B%A4.%20vi%20%ED%8E%B8%EC%A7%91%EA%B8%B0%EC%97%90%20%EB%8C%80%ED%95%B4%EC%84%9C%20%EC%82%B4%ED%8E%B4%EB%B3%B4%EB%8F%84%EB%A1%9D%20%ED%95%98%EC%9E%90%20vi%20%ED%8E%B8%EC%A7%91%EA%B8%B0%EB%8A%94%20%EC%B4%9D%203%EA%B0%80%EC%A7%80%EC%9D%98%20%EB%AA%85%EB%A0%B9%EB%AA%A8%EB%93%9C%2C%20%EC%9E%85%EB%A0%A5%EB%AA%A8%EB%93%9C%2C%20%EB%A7%88%EC%A7%80%EB%A7%89%20%ED%96%89%EB%AA%A8%EB%93%9C%EB%A1%9C%20%EA%B5%AC%EC%84%B1%EB%90%98%EC%96%B4%20%EC%9E%88%EB%8B%A4.%20%EB%A8%BC%EC%A0%80%20%EC%9D%B4%20vi%20%ED%8E%B8%22%7D")](<https://potato-yong.tistory.com/132>)

[![Link preview](/assets/posts/flask-installation/link-preview-06.png "dorami-card:%7B%22title%22%3A%20%22Python%20Flask%20Jinja2%20%ED%85%9C%ED%94%8C%EB%A6%BF%20%EC%82%AC%EC%9A%A9%ED%95%98%EA%B8%B0%22%2C%20%22description%22%3A%20%22%ED%8C%8C%EC%9D%B4%EC%8D%AC%20%EA%B4%80%EB%A0%A8%20%ED%8F%AC%EC%8A%A4%ED%8C%85%20%EB%AA%A9%EB%A1%9D%20%EB%8D%94%EB%B3%B4%EA%B8%B0%20%5BPython%5D%20Flask%20%EC%97%94%EB%93%9C%ED%8F%AC%EC%9D%B8%ED%8A%B8%20%EC%84%A4%EC%A0%95%ED%95%98%EA%B8%B0%28Endpoint%29%20%5BPython%5D%20Flask%20%EC%9B%B9%20%EC%84%9C%EB%B2%84%20%EA%B5%AC%EC%B6%95%ED%95%98%EA%B8%B0%20-%202%28Linux%20Ubuntu%2016.04%20Flask%20Web%20Server%29%20%5BPython%5D%20Flask%20%EC%9B%B9%20%EC%84%9C%EB%B2%84%20%EA%B5%AC%EC%B6%95%ED%95%98%EA%B8%B0%20-%201%28Linux%20Ubuntu%2016.04%20Flask%20Web%20Server%22%7D")](<https://salguworld.tistory.com/entry/Flask-Jinja2-%ED%85%9C%ED%94%8C%EB%A6%BF-%EC%82%AC%EC%9A%A9%ED%95%98%EA%B8%B0Flask-Jinja2-Template>)
