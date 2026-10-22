---
title: "picoCTF: login(Web)"
date: 2025-01-22
summary: "picoCTF: login(Web)에 관한 공부 기록과 풀이 과정을 정리합니다."
category: "보안/CTF 풀이"
tags: ["CTF", "웹 보안"]
sourceUrl: "https://learntoflyclotilde.tistory.com/entry/picoCTF-loginWeb"
draft: false
---

## **Problem**

![picoCTF: login(Web) 이미지 1](/assets/posts/picoctf-login-web/image-01.png)

hint 1 : None
---

## **Solution**
**1. 문제 사이트 접속.**

![picoCTF: login(Web) 이미지 2](/assets/posts/picoctf-login-web/image-02.png)

**2. 개발자도구 “Source”에서 Base64로 인코딩된 “Username”과 “PW”가 존재****.**

![picoCTF: login(Web) 이미지 3](/assets/posts/picoctf-login-web/image-03.png)

**3. Base64 디코딩을 하면 “PW”에서 flag 값 얻음**

![picoCTF: login(Web) 이미지 4](/assets/posts/picoctf-login-web/image-04.png)

---

## **결론**
- 소스 코드 분석 후, Base64 디코딩을 통해 문제 해결
