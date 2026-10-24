---
title: "picoCTF: dont-use-client-side(Web)"
date: 2025-01-22T15:57:06+09:00
summary: "클라이언트 JavaScript에 나뉘어 있는 문자열을 찾아 순서대로 조합하는 웹 문제 풀이입니다."
category: "보안/CTF 풀이"
tags: ["CTF", "웹 보안"]
sourceUrl: "https://learntoflyclotilde.tistory.com/entry/picoCTF-dont-use-client-sideWeb"
draft: false
---

## **{{color:#52643c}}Problem{{/color}}**

![picoCTF: dont-use-client-side(Web) 이미지 1](/assets/posts/picoctf-dont-use-client-side-web/image-01.png)

{{color:#52643c}}hint 1 : Never trust the client{{/color}}

---

## **{{color:#52643c}}Solution{{/color}}**

**1. 문제 사이트 접속.**

![picoCTF: dont-use-client-side(Web) 이미지 2](/assets/posts/picoctf-dont-use-client-side-web/image-02.png)

**2. 개발자도구 “Source”에서 if문으로 flag 값이 각각 나눠져 있는 것을 확인.**

![picoCTF: dont-use-client-side(Web) 이미지 3](/assets/posts/picoctf-dont-use-client-side-web/image-03.png)

**3. if문의 split 순서대로 배열을 하면 flag 값 완성.**

**4. flag : picoCTF{no_clients_plz_1a3c89}**

---

## **{{color:#697d4f}}결론{{/color}}**

- 소스코드 분석을 통해 문제 해결
