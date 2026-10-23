---
title: "picoCTF: GET aHEAD(Web)"
date: 2024-07-08
summary: "Burp Suite Repeater에서 요청 메서드를 GET에서 HEAD로 바꿔 picoCTF 문제를 풀이합니다."
category: "보안/CTF 풀이"
tags: ["CTF", "웹 보안"]
sourceUrl: "https://learntoflyclotilde.tistory.com/entry/picoCTF-GET-aHEADWeb"
draft: false
---

## **{{color:#52643c}}Problem{{/color}}**

![picoCTF: GET aHEAD(Web) 이미지 1](/assets/posts/picoctf-get-ahead-web/image-01.png)

{{color:#52643c}}hint 1 : Maybe you have more than 2 choices{{/color}}

{{color:#52643c}}hint 2 : Check out tools like Burpsuite to modify your requests and look at the responses{{/color}}

---

## **{{color:#52643c}}Solution{{/color}}**

**1. 문제 링크 접속**

**2. proxy 잡고, “Choose Red” 클릭(아무거나 클릭해도 무방한 듯)**

![picoCTF: GET aHEAD(Web) 이미지 2](/assets/posts/picoctf-get-ahead-web/image-02.png)

**3. Repeater로 보냄**

![picoCTF: GET aHEAD(Web) 이미지 3](/assets/posts/picoctf-get-ahead-web/image-03.png)

**4. “GET” method → “HEAD” method로 변경하여 보내면 flag 획득**

![picoCTF: GET aHEAD(Web) 이미지 4](/assets/posts/picoctf-get-ahead-web/image-04.png)

---

## **{{color:#697d4f}}결론{{/color}}**

- Method 변경으로 문제 해결
