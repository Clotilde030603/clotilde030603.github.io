---
title: "picoCTF: login(Web)"
date: 2025-01-22
summary: ""
category: "보안/CTF 풀이"
tags: ["CTF", "웹 보안"]
sourceUrl: "https://learntoflyclotilde.tistory.com/entry/picoCTF-loginWeb"
draft: false
---

## **{{color:#52643c}}Problem{{/color}}**

![picoCTF: login(Web) 이미지 1](/assets/posts/picoctf-login-web/image-01.png)

{{color:#697d4f}}hint 1 : None{{/color}}

---

## **{{color:#52643c}}Solution{{/color}}**

**1. 문제 사이트 접속.**

![picoCTF: login(Web) 이미지 2](/assets/posts/picoctf-login-web/image-02.png)

**2. 개발자도구 “Source”에서 Base64로 인코딩된 “Username”과 “PW”가 존재****.**

![picoCTF: login(Web) 이미지 3](/assets/posts/picoctf-login-web/image-03.png)

**3. Base64 디코딩을 하면 “PW”에서 flag 값 얻음**

![picoCTF: login(Web) 이미지 4](/assets/posts/picoctf-login-web/image-04.png)

---

## **{{color:#697d4f}}결론{{/color}}**

- 소스 코드 분석 후, Base64 디코딩을 통해 문제 해결
