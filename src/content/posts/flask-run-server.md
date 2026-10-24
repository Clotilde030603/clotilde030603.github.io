---
title: "Flask 서버 실행"
date: 2025-01-24T09:44:10+09:00
summary: "Raspberry Pi에서 Flask 앱을 구성하고 HTML·정적 파일을 연결해 서버를 실행하는 과정입니다."
category: "개발/IoT·Raspberry Pi"
tags: ["Flask", "Raspberry Pi"]
sourceUrl: "https://learntoflyclotilde.tistory.com/entry/Flask-%EC%84%9C%EB%B2%84-%EC%8B%A4%ED%96%89"
draft: false
---

## **{{color:#52643c}}실행 방법{{/color}}**

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

**{{color:#676e65}}@app.route() 안에 작성하는 url과 url 별 함수명은 모두 달라야 함.{{/color}}**

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

**{{color:#676e65}}render_template를 import하고 index.html을 입력하면 해당 url에 접속했을 때 지정한 html 파일이 렌더됨.{{/color}}**

**8. static 폴더에 이미지, css 파일 등을 담아둠.**

```

# static 폴더 절대 경로 검색 #
~/flask/static $ pwd
/home/ppojjacki/flask/static

```

```

$ scp 쿼카2.jpeg ppojjacki@192.168.0.166:/home/ppojjacki/flask/static

```

`{{color:#676e65}}scp [옵션] [파일명] [원격지_id]@[원격지_ip]:[받는 위치]{{/color}}`

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

**{{color:#676e65}}flask에서는 static 안의 이미지, css 파일 등의 경로를 지정할 때는 아래와 같이 지정해야 함.{{/color}}**

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

## **{{color:#52643c}}참고 자료{{/color}}**

[![Link preview](/assets/posts/flask-run-server/link-preview-01.png "dorami-card:%7B%22title%22%3A%20%22%5BRocky%20Linux%5D%2015%EA%B0%80%EC%A7%80%20%EB%A6%AC%EB%88%85%EC%8A%A4%20%EA%B8%B0%EB%B3%B8%20%EB%AA%85%EB%A0%B9%EC%96%B4%20%EC%A0%95%EB%A6%AC%22%2C%20%22description%22%3A%20%22%EB%A6%AC%EB%88%85%EC%8A%A4%20%EB%AA%85%EB%A0%B9%EC%9D%80%20%EC%98%B5%EC%85%98%EA%B9%8C%EC%A7%80%20%EB%AA%A8%EB%91%90%20%ED%8F%AC%ED%95%A8%ED%95%B4%EC%84%9C%20%EC%88%98%EC%B2%9C%20%EA%B0%9C%EA%B0%80%20%EB%84%98%EC%9D%84%20%EC%A0%95%EB%8F%84%EB%A1%9C%20%EB%A7%8E%EC%8A%B5%EB%8B%88%EB%8B%A4.%20%EB%AA%85%EB%A0%B9%EC%9D%84%20%EB%8B%A4%20%EC%99%B8%EC%9A%B4%EB%8B%A4%EB%8A%94%20%EA%B2%83%EC%9D%80%20%EA%B1%B0%EC%9D%98%20%EB%B6%88%EA%B0%80%EB%8A%A5%ED%95%98%EA%B3%A0%20%EC%99%B8%EC%9A%B8%20%ED%95%84%EC%9A%94%EB%8F%84%20%EC%97%86%EC%A7%80%EB%A7%8C%2C%20%EB%A6%AC%EB%88%85%EC%8A%A4%EB%A5%BC%20%EC%82%AC%EC%9A%A9%ED%95%98%EB%8A%94%20%EB%8D%B0%20%ED%95%84%EC%9A%94%ED%95%9C%20%EA%B8%B0%EB%B3%B8%20%EB%AA%85%EB%A0%B9%2015%EA%B0%80%EC%A7%80%EB%8A%94%20%ED%95%84%EC%88%98%22%7D")](<https://www.hanbit.co.kr/channel/category/category_view.html?cms_code=CMS6390061632>)

[![Link preview](/assets/posts/flask-run-server/link-preview-02.png "dorami-card:%7B%22title%22%3A%20%22%5Bpython%5D%20Flask%EB%A1%9C%20%EC%84%9C%EB%B2%84%20%EC%8B%A4%ED%96%89%ED%95%98%EA%B8%B0%22%2C%20%22description%22%3A%20%22%ED%8C%8C%EC%9D%B4%EC%8D%AC%EC%9C%BC%EB%A1%9C%20%EC%93%B0%EC%9D%B8%20%EC%9B%B9%20%ED%94%84%EB%A0%88%EC%9E%84%EC%9B%8C%ED%81%AC%EB%A1%9C%2C%20%EC%84%9C%EB%B2%84%EB%A5%BC%20%EA%B5%AC%EB%8F%99%ED%95%98%EB%8A%94%20%EB%8D%B0%20%ED%95%84%EC%9A%94%ED%95%9C%20%EA%B8%B0%EB%8A%A5%EC%9D%84%20%EC%A0%9C%EA%B3%B5%ED%95%9C%EB%8B%A4.Flask%20%EC%84%9C%EB%B2%84%EB%A5%BC%20%EB%A7%8C%EB%93%A4%20%EB%95%8C%EB%8A%94%20%ED%95%AD%EC%83%81static%20%ED%8F%B4%EB%8D%94%2C%20templates%20%ED%8F%B4%EB%8D%94%2C%20app.py%20%ED%8C%8C%EC%9D%BC%EC%9D%84%20%EB%A7%8C%EB%93%A4%EA%B3%A0%20%EC%8B%9C%EC%9E%91%ED%95%9C%EB%8B%A4.flask%20%EC%84%9C%EB%B2%84%EB%A5%BC%20%EB%8F%8C%EB%A6%AC%EB%8A%94%20%ED%8C%8C%EC%9D%BC%EC%9D%98%20%EC%9D%B4%22%7D")](<https://velog.io/@e_juhee/python-Flask>)

[![Link preview](/assets/posts/flask-run-server/link-preview-03.png "dorami-card:%7B%22title%22%3A%20%22%5BLinux%5D%20vi%20%ED%8E%B8%EC%A7%91%EA%B8%B0%20%EB%AA%85%EB%A0%B9%EC%96%B4%20%EC%A0%95%EB%A6%AC%ED%95%98%EA%B8%B0%22%2C%20%22description%22%3A%20%22vi%20%EB%AA%85%EB%A0%B9%EC%96%B4%EB%8A%94%20Linux%2C%20Unix%EC%97%90%EC%84%9C%20%EC%82%AC%EC%9A%A9%EB%90%98%EB%8A%94%20%ED%8E%B8%EC%A7%91%EA%B8%B0%EB%A5%BC%20%EC%82%AC%EC%9A%A9%ED%95%98%EB%8A%94%20%EB%AA%85%EB%A0%B9%EC%96%B4%EB%8B%A4.%20vi%20%ED%8E%B8%EC%A7%91%EA%B8%B0%EC%97%90%20%EB%8C%80%ED%95%B4%EC%84%9C%20%EC%82%B4%ED%8E%B4%EB%B3%B4%EB%8F%84%EB%A1%9D%20%ED%95%98%EC%9E%90%20vi%20%ED%8E%B8%EC%A7%91%EA%B8%B0%EB%8A%94%20%EC%B4%9D%203%EA%B0%80%EC%A7%80%EC%9D%98%20%EB%AA%85%EB%A0%B9%EB%AA%A8%EB%93%9C%2C%20%EC%9E%85%EB%A0%A5%EB%AA%A8%EB%93%9C%2C%20%EB%A7%88%EC%A7%80%EB%A7%89%20%ED%96%89%EB%AA%A8%EB%93%9C%EB%A1%9C%20%EA%B5%AC%EC%84%B1%EB%90%98%EC%96%B4%20%EC%9E%88%EB%8B%A4.%20%EB%A8%BC%EC%A0%80%20%EC%9D%B4%20vi%20%ED%8E%B8%22%7D")](<https://potato-yong.tistory.com/132>)

[![Link preview](/assets/posts/flask-run-server/link-preview-04.png "dorami-card:%7B%22title%22%3A%20%22%5BLinux%5D%20%EB%A6%AC%EB%88%85%EC%8A%A4%20scp%20%EB%AA%85%EB%A0%B9%EC%96%B4%20%EC%82%AC%EC%9A%A9%EB%B2%95%22%2C%20%22description%22%3A%20%22scp%20secure%20copy%EC%9D%98%20%EC%A4%84%EC%9E%84%EB%A7%90%EB%A1%9C%20ssh%EB%A5%BC%20%EC%9D%B4%EC%9A%A9%ED%95%98%EC%97%AC%20%EB%84%A4%ED%8A%B8%EC%9B%8C%ED%81%AC%EB%A1%9C%20%EC%97%B0%EA%B2%B0%EB%90%9C%20%ED%98%B8%EC%8A%A4%ED%8A%B8%EA%B0%84%EC%97%90%20%ED%8C%8C%EC%9D%BC%EC%9D%84%20%EC%A3%BC%EA%B3%A0%EB%B0%9B%EB%8A%94%20%EB%AA%85%EB%A0%B9%EC%96%B4%20%EC%9B%90%EA%B2%A9%EC%A7%80%EC%97%90%20%EC%9E%88%EB%8A%94%20%ED%8C%8C%EC%9D%BC%EA%B3%BC%20%EB%94%94%EB%A0%89%ED%84%B0%EB%A6%AC%EB%A5%BC%20%EB%B3%B4%EB%82%B4%EA%B1%B0%EB%82%98%20%EA%B0%80%EC%A0%B8%EC%98%AC%20%EB%95%8C%20%EC%82%AC%EC%9A%A9%ED%95%98%EB%8A%94%20%ED%8C%8C%EC%9D%BC%20%EC%A0%84%EC%86%A1%20%ED%94%84%EB%A1%9C%ED%86%A0%EC%BD%9C%20ssh%EC%99%80%20%EB%8F%99%EC%9D%BC%ED%95%9C%22%7D")](<https://eehoeskrap.tistory.com/543>)

[![Link preview](/assets/posts/flask-run-server/link-preview-05.png "dorami-card:%7B%22title%22%3A%20%22scp%EB%A1%9C%20%ED%84%B0%EB%AF%B8%EB%84%90%EC%97%90%EC%84%9C%20%ED%8C%8C%EC%9D%BC%20%EC%A3%BC%EA%B3%A0%20%EB%B0%9B%EA%B8%B0%22%2C%20%22description%22%3A%20%22scp%28secure%20copy%29%20%EC%82%AC%EC%9A%A9%EB%B2%95%EC%9D%84%20%EC%A0%95%EB%A6%AC%ED%95%B4%20%EB%B3%B4%EA%B2%A0%EC%8A%B5%EB%8B%88%EB%8B%A4.%20%EC%9B%90%EA%B2%A9%EC%A7%80%EC%9D%98%20%EC%84%9C%EB%B2%84%EB%93%A4%EC%9D%80%20%EB%AA%A8%EB%91%90%20%EA%B3%B5%EC%9D%B8%20IP%EB%A5%BC%20%EA%B0%80%EC%A7%80%EC%A7%80%20%EC%95%8A%EB%8A%94%20%EA%B2%BD%EC%9A%B0%EA%B0%80%20%EB%A7%8E%EA%B3%A0%2C%20%EB%B3%B4%EC%95%88%20%EB%AC%B8%EC%A0%9C%EB%A1%9C%20%EC%A0%91%EC%86%8D%ED%95%98%EB%8A%94%20%ED%84%B0%EB%AF%B8%EB%84%90%20%EC%99%B8%EC%97%90%EB%8A%94%20%EC%A7%81%EC%A0%91%20%EC%97%B0%EA%B2%B0%EC%9D%B4%20%EC%95%88%EB%90%98%EB%8A%94%20%EA%B2%BD%EC%9A%B0%EA%B0%80%20%EB%8C%80%EB%B6%80%EB%B6%84%EC%9E%85%EB%8B%88%EB%8B%A4.%20%EC%9B%90%EA%B2%A9%EC%A7%80%22%7D")](<https://ongamedev.tistory.com/417>)
