---
title: "picoCTF: GET aHEAD(Web)"
date: 2024-07-08
summary: ""
category: "보안/CTF 풀이"
tags: ["CTF", "웹 보안"]
sourceUrl: "https://learntoflyclotilde.tistory.com/entry/picoCTF-GET-aHEADWeb"
draft: false
---

## **Problem**

![picoCTF: GET aHEAD(Web) 이미지 1](/assets/posts/picoctf-get-ahead-web/image-01.png)

hint 1 : Maybe you have more than 2 choices

hint 2 : Check out tools like Burpsuite to modify your requests and look at the responses

---

## **Solution**

**1. 문제 링크 접속**

**2. proxy 잡고, “Choose Red” 클릭(아무거나 클릭해도 무방한 듯)**

![picoCTF: GET aHEAD(Web) 이미지 2](/assets/posts/picoctf-get-ahead-web/image-02.png)

**3. Repeater로 보냄**

![picoCTF: GET aHEAD(Web) 이미지 3](/assets/posts/picoctf-get-ahead-web/image-03.png)

**4. “GET” method → “HEAD” method로 변경하여 보내면 flag 획득**

![picoCTF: GET aHEAD(Web) 이미지 4](/assets/posts/picoctf-get-ahead-web/image-04.png)

---

## **결론**

- Method 변경으로 문제 해결
