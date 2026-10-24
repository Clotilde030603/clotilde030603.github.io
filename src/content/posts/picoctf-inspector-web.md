---
title: "picoCTF: Insp3ct0r(Web)"
date: 2024-11-09T21:54:57+09:00
summary: "브라우저 개발자 도구에서 HTML·CSS·JavaScript에 나뉜 세 flag 조각을 찾습니다."
category: "보안/CTF 풀이"
tags: ["CTF", "웹 보안"]
sourceUrl: "https://learntoflyclotilde.tistory.com/entry/picoCTF-Insp3ct0rWeb"
draft: false
---

## **{{color:#52643c}}Problem{{/color}}**

![picoCTF: Insp3ct0r(Web) 이미지 1](/assets/posts/picoctf-inspector-web/image-01.png)

{{color:#52643c}}hint 1 : How do you inspect web code on a browser?{{/color}}

{{color:#52643c}}hint 2 : There's 3 parts{{/color}}

---

## **{{color:#52643c}}Solution{{/color}}**

**1. 문제 링크 접속**

![picoCTF: Insp3ct0r(Web) 이미지 2](/assets/posts/picoctf-inspector-web/image-02.png)

**2. “How”를 살펴보면 HTML, CSS, JS(JavaScript)로 사이트가 구성됨을 알 수 있음**

![picoCTF: Insp3ct0r(Web) 이미지 3](/assets/posts/picoctf-inspector-web/image-03.png)

**3. 개발자 도구에서 “Source”의 HTML 코드를 보면 첫 번째 flag 값 조각 발견**

![picoCTF: Insp3ct0r(Web) 이미지 4](/assets/posts/picoctf-inspector-web/image-04.png)

**4. JS 코드를 보면 세 번째 flag 값 조각 발견**

![picoCTF: Insp3ct0r(Web) 이미지 5](/assets/posts/picoctf-inspector-web/image-05.png)

**5. CSS 코드를 보면 두 번째 flag 값 조각 발견**

![picoCTF: Insp3ct0r(Web) 이미지 6](/assets/posts/picoctf-inspector-web/image-06.png)

**6. flag : picoCTF{tru3_d3t3ct1ve_0r_ju5t_lucky?832b0699}**

---

## **{{color:#697d4f}}결론{{/color}}**

- 소스 코드 분석으로 문제 해결
