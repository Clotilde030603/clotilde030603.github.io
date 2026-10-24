---
title: "picoCTF: Some Assembly Required 1(Web)"
date: 2025-01-22T15:44:41+09:00
summary: "JavaScript에서 확인한 경로의 파일을 내려받아 010 Editor로 분석하는 문제 풀이입니다."
category: "보안/CTF 풀이"
tags: ["CTF", "웹 보안"]
sourceUrl: "https://learntoflyclotilde.tistory.com/entry/picoCTF-Some-Assembly-Required-1Web"
draft: false
---

## **{{color:#52643c}}Problem{{/color}}**

![picoCTF: Some Assembly Required 1(Web) 이미지 1](/assets/posts/picoctf-some-assembly-required-web/image-01.png)

{{color:#52643c}}hint : None{{/color}}

---

## **{{color:#52643c}}Solution{{/color}}**

**1. 문제 사이트 접속.**

![picoCTF: Some Assembly Required 1(Web) 이미지 2](/assets/posts/picoctf-some-assembly-required-web/image-02.png)

**2. 개발자 도구 "Source" “G82XCw5CX3.js”에서 의심스러운 경로(./JIFxzHyW8W) 발견.**

![picoCTF: Some Assembly Required 1(Web) 이미지 3](/assets/posts/picoctf-some-assembly-required-web/image-03.png)

**3. “./JIFxzHyW8W” 경로 접속.**

**4. 파일 다운로드 됨.**

![picoCTF: Some Assembly Required 1(Web) 이미지 4](/assets/posts/picoctf-some-assembly-required-web/image-04.png)

**5. 파일을 "010Editor"로 열어 flag 값 발견.**

![picoCTF: Some Assembly Required 1(Web) 이미지 5](/assets/posts/picoctf-some-assembly-required-web/image-05.png)

**6. flag: picoCTF{a8bae10f4d9544110222c2d639dc6de6}**

---

## **{{color:#697d4f}}결론{{/color}}**

- 소스 코드를 통해 의심스러운 경로 발견 후, 파일 다운로드 받아 헥스 값 확인을 통해 문제 해결
