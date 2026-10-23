---
title: "picoCTF: Cookies(Web)"
date: 2024-11-09
summary: ""
category: "보안/CTF 풀이"
tags: ["CTF", "웹 보안"]
sourceUrl: "https://learntoflyclotilde.tistory.com/entry/picoCTF-CookiesWeb"
draft: false
---

## **{{color:#52643c}}Problem{{/color}}**

![picoCTF: Cookies(Web) 이미지 1](/assets/posts/picoctf-cookies-web/image-01.png)

**{{color:#52643c}}hint 1 : None{{/color}}**

---

## **{{color:#52643c}}Solution{{/color}}**

**1. 문제 링크 접속**

![picoCTF: Cookies(Web) 이미지 2](/assets/posts/picoctf-cookies-web/image-02.png)

**2. “snickerdoodle” 검색**

![picoCTF: Cookies(Web) 이미지 3](/assets/posts/picoctf-cookies-web/image-03.png)

![picoCTF: Cookies(Web) 이미지 4](/assets/posts/picoctf-cookies-web/image-04.png)

**3. cookie 값이 0임을 확인**

![picoCTF: Cookies(Web) 이미지 5](/assets/posts/picoctf-cookies-web/image-05.png)

**4. cookie 값을 1부터 변경 시도**

**5. cookie 값이 18일 때 flag 얻음**

![picoCTF: Cookies(Web) 이미지 6](/assets/posts/picoctf-cookies-web/image-06.png)

**6. cookie 값이 29부터는 없음을 확인**

---

## **{{color:#697d4f}}결론{{/color}}**

- 쿠키 값 변조로 문제 해결
