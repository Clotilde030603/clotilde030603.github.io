---
title: "picoCTF: Cookies(Web)"
date: 2024-11-09
summary: "picoCTF: Cookies(Web)에 관한 공부 기록과 풀이 과정을 정리합니다."
category: "보안/CTF 풀이"
tags: ["CTF", "웹 보안"]
sourceUrl: "https://learntoflyclotilde.tistory.com/entry/picoCTF-CookiesWeb"
draft: false
---

## **Problem**

![picoCTF: Cookies(Web) 이미지 1](/assets/posts/picoctf-cookies-web/image-01.png)

**hint 1 : None**

---

**Solution**

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

## **결론**

- 쿠키 값 변조로 문제 해결
