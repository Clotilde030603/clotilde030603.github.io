---
title: "Flask 서버 실행"
date: 2025-01-24
summary: "Flask 앱 실행과 라우팅, 템플릿 및 정적 파일 연결 과정을 정리합니다."
category: "개발/웹 서버"
tags: []
sourceUrl: "https://learntoflyclotilde.tistory.com/entry/Flask-%EC%84%9C%EB%B2%84-%EC%8B%A4%ED%96%89"
draft: false
---

## **실행 방법**
**1. flask 폴더 생성.**
```
$ sudo mkdir flask
```

**2. flask 폴더 안에 static 폴더, templates 폴더, app.py 파일 생성.**
```
# flask 폴더 안으로 접근 #
	$ cd flask
# 폴더, 파일 생성 #
	$ mkdir static
	$ mkdir templates
	$ touch app.py
```

**3. app.py 내용 작성.**
```
from flask import Flask
app = Flask(__name__)

@app.route('/')
def home():
   return 'This is Home!'

if __name__ == '__main__':  
   app.run('0.0.0.0',port=5000,debug=True)
```

**4. app.py 실행.**
```
$ python app.py
```

![Flask 서버 실행 이미지 1](/assets/posts/flask-run-server/image-01.png)

**5. app.py URL 나누기**
```
from flask import Flask
app = Flask(__name__)

@app.route('/')
def home():
    return 'This is Home!'

@app.route('/mypage')
def mypage():
    return 'This is My Page!'

if __name__ == '__main__':
    app.run('0.0.0.0', port=5000, debug=True)
```

**@app.route() 안에 작성하는 url과 url 별 함수명은 모두 달라야 함.**
**6. templates 폴더 안 idex.html 생성.**
```
# flask 폴더의 templates 폴더 안으로 접근 #
	$ cd templates
# index.html 파일 생성 #
	$ touch index.html
```

**7. app.py 내용(index.html 파일 불러오기) 작성.**
```
from flask import Flask, render_template
app = Flask(__name__)

@app.route('/')
def home():
   return render_template('index.html')

if __name__ == '__main__':
   app.run('0.0.0.0', port=5000, debug=True)
```

**render_template를 import하고 index.html을 입력하면 해당 url에 접속했을 때 지정한 html 파일이 렌더됨.**
**8. static 폴더에 이미지, css 파일 등을 담아둠.**
```
# static 폴더 절대 경로 검색 #
~/flask/static $ pwd
/home/ppojjacki/flask/static
```

```
$ scp 쿼카2.jpeg ppojjacki@192.168.0.166:/home/ppojjacki/flask/static
```

**scp \[옵션\] \[파일명\] \[원격지_id\]@\[원격지_ip\]:\[받는 위치\]**
**9. index.html 내용(index.html 파일 내 이미지 불러오기) 작성.**
```
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <script
      src="https://code.jquery.com/jquery-3.5.1.slim.min.js"
      integrity="sha384-DfXdz2htPH0lsSSs5nCTpuj/zy4C+OGpamoFVy38MVBnE+IbbVYUew+OrCXaRkfj"
      crossorigin="anonymous"
    ></script>
    <title>Document</title>
  </head>
  <body>
    <img src="{{ url_for('static', filename='쿼카2.jpeg') }}" />
  </body>
</html>
```

**flask에서는 static 안의 이미지, css 파일 등의 경로를 지정할 때는 아래와 같이 지정해야 함.**
```
 {{ url_for('static', filename='파일명') }}
```

**10. app.py 실행.**
```
$ python app.py
```

![Flask 서버 실행 이미지 2](/assets/posts/flask-run-server/image-02.png)

**11. 해당 IP 접속해서 확인.**

![Flask 서버 실행 이미지 3](/assets/posts/flask-run-server/image-03.png)

---

## **참고 자료**

\[Rocky Linux\] 15가지 리눅스 기본 명령어 정리
리눅스 명령은 옵션까지 모두 포함해서 수천 개가 넘을 정도로 많습니다. 명령을 다 외운다는 것은 거의 불가능하고 외울 필요도 없지만, 리눅스를 사용하는 데 필요한 기본 명령 15가지는 필수
www.hanbit.co.kr

\[python\] Flask로 서버 실행하기
파이썬으로 쓰인 웹 프레임워크로, 서버를 구동하는 데 필요한 기능을 제공한다.Flask 서버를 만들 때는 항상static 폴더, templates 폴더, app.py 파일을 만들고 시작한다.flask 서버를 돌리는 파일의 이
velog.io

\[Linux\] vi 편집기 명령어 정리하기
vi 명령어는 Linux, Unix에서 사용되는 편집기를 사용하는 명령어다. vi 편집기에 대해서 살펴보도록 하자 vi 편집기는 총 3가지의 명령모드, 입력모드, 마지막 행모드로 구성되어 있다. 먼저 이 vi 편
potato-yong.tistory.com

\[Linux\] 리눅스 scp 명령어 사용법
scp secure copy의 줄임말로 ssh를 이용하여 네트워크로 연결된 호스트간에 파일을 주고받는 명령어 원격지에 있는 파일과 디렉터리를 보내거나 가져올 때 사용하는 파일 전송 프로토콜 ssh와 동일한
eehoeskrap.tistory.com

scp로 터미널에서 파일 주고 받기
scp(secure copy) 사용법을 정리해 보겠습니다. 원격지의 서버들은 모두 공인 IP를 가지지 않는 경우가 많고, 보안 문제로 접속하는 터미널 외에는 직접 연결이 안되는 경우가 대부분입니다. 원격지
ongamedev.tistory.com
