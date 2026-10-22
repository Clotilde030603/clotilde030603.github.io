---
title: "picoCTF: Scavenger Hunt(Web)"
date: 2025-01-22
summary: "picoCTF: Scavenger Hunt(Web)에 관한 공부 기록과 풀이 과정을 정리합니다."
category: "보안/CTF 풀이"
tags: ["CTF", "웹 보안"]
sourceUrl: "https://learntoflyclotilde.tistory.com/entry/picoCTF-Scavenger-Hunt"
draft: false
---

## **Problem**

![picoCTF: Scavenger Hunt(Web) 이미지 1](/assets/posts/picoctf-scavenger-hunt-web/image-01.png)

hint 1 : You should have enough hints to find the files, don't run a brute forcer.
---

## **Solution**
**1. 문제 링크 접속.**

![picoCTF: Scavenger Hunt(Web) 이미지 2](/assets/posts/picoctf-scavenger-hunt-web/image-02.png)

**2. "How"를 보면 HTML. CSS, JS(JavaScript)로 사이트가 구성됨을 확인.**

![picoCTF: Scavenger Hunt(Web) 이미지 3](/assets/posts/picoctf-scavenger-hunt-web/image-03.png)

**3. 개발자 도구 "Source"의 HTML 코드에서 첫 번째 flag 조각 발견.**

![picoCTF: Scavenger Hunt(Web) 이미지 4](/assets/posts/picoctf-scavenger-hunt-web/image-04.png)

**4. CSS 코드에서 두 번째 flag 조각 발견.**

![picoCTF: Scavenger Hunt(Web) 이미지 5](/assets/posts/picoctf-scavenger-hunt-web/image-05.png)

**5. JS 코그에서 세 번째 flag 조각 힌트 발견.**

![picoCTF: Scavenger Hunt(Web) 이미지 6](/assets/posts/picoctf-scavenger-hunt-web/image-06.png)

**6. 힌트에서 "robots.txt" 유추**
**7. "robots.txt"에서 세 번째 flag 조각 발견 및 네 번째 flag 조각 힌트 발견.**

![picoCTF: Scavenger Hunt(Web) 이미지 7](/assets/posts/picoctf-scavenger-hunt-web/image-07.png)

**8. 힌트를 통해 ".htaccess" 유추**

\[Apache2\] .htaccess 설정 파일 사용하기
.htaccess란 htaccess는 'hypertext acess'의 약자로 디렉토리에 대한 설정 옵션을 제공한다. Apache 웹 서버에서 apache2.conf 또는 sites-enabled 파일을 확인해보면 다음과 같이 태그를 통해 파일이 위치한 경로
doqtqu.tistory.com

**9. ".htaccess"에서 네 번째 flag 조각 발견 및 다섯 번째 flag 조각 힌트 발견.**

![picoCTF: Scavenger Hunt(Web) 이미지 8](/assets/posts/picoctf-scavenger-hunt-web/image-08.png)

**10. 힌트를 통해 ".DS_Store" 유추**

Mac OS X의 숨겨진 파일들과 디렉토리
Mac OS X의 숨겨진 파일들과 디렉토리들 옮긴 글 - Mac OS X Hidden Files & Directories Mac OS X 볼륨에는 상당히 많은 파일들과 디렉토리들(폴더들)이 Finder에서는 보이질 않습니다. 대부분은, 그럴만한 이유
aginamu.com

**11.".DS_Store"에서 마지막 flag 조각 발견**

![picoCTF: Scavenger Hunt(Web) 이미지 9](/assets/posts/picoctf-scavenger-hunt-web/image-09.png)

**12. flag: picoCTF{th4ts_4_l0t_0f_pl4c3s_2_lO0k_35844447}**
---

## **결론**
- 소스 코드 분석으로 문제 해결
