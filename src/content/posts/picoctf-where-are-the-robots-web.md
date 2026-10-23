---
title: "picoCTF: where are the robots(Web)"
date: 2025-01-22
summary: "robots.txt에 공개된 경로를 확인해 숨겨진 페이지에서 flag를 찾는 picoCTF 풀이입니다."
category: "보안/CTF 풀이"
tags: ["CTF", "웹 보안"]
sourceUrl: "https://learntoflyclotilde.tistory.com/entry/picoCTF-where-are-the-robotsWeb"
draft: false
---

## **{{color:#52643c}}Problem{{/color}}**

![picoCTF: where are the robots(Web) 이미지 1](/assets/posts/picoctf-where-are-the-robots-web/image-01.png)

{{color:#52643c}}hint 1 : What part of the website could tell you where the creator doesn't want you to look?{{/color}}

---

## **{{color:#52643c}}Solution{{/color}}**

**1. 문제 사이트 접속**

![picoCTF: where are the robots(Web) 이미지 2](/assets/posts/picoctf-where-are-the-robots-web/image-02.png)

**2. flag가 숨겨져 보이지 않으므로 "robots.txt" 유추**

**3. "robots.txt"에서 "/477ce.html"라는 경로 확인.**

![picoCTF: where are the robots(Web) 이미지 3](/assets/posts/picoctf-where-are-the-robots-web/image-03.png)

**4. "/477ce.html"에서 flag 발견.**

![picoCTF: where are the robots(Web) 이미지 4](/assets/posts/picoctf-where-are-the-robots-web/image-04.png)

**5. flag: picoCTF{ca1cu1at1ng_Mach1n3s_477ce}**

---

## **{{color:#697d4f}}결론{{/color}}**

- robots.txt(검색 엔진이 운영중인 검색 로봇이 사이트 및 웹페이지를 수집할 수 있도록 허용하거나 제한하는 국제 표준 설정)에 접근하여 문제 해결
