---
title: "picoCTF: Scavenger Hunt(Web)"
date: 2025-01-22
summary: "picoCTF: Scavenger Hunt(Web)에 관한 공부 기록과 풀이 과정을 정리합니다."
category: "보안/CTF 풀이"
tags: ["CTF", "웹 보안"]
sourceUrl: "https://learntoflyclotilde.tistory.com/entry/picoCTF-Scavenger-Hunt"
draft: false
---

## **Problem**

![picoCTF: Scavenger Hunt(Web) 이미지 1](/assets/posts/picoctf-scavenger-hunt-web/image-01.png)

hint 1 : You should have enough hints to find the files, don't run a brute forcer.

---

## **Solution**

**1. 문제 링크 접속.**

![picoCTF: Scavenger Hunt(Web) 이미지 2](/assets/posts/picoctf-scavenger-hunt-web/image-02.png)

**2. "How"를 보면 HTML. CSS, JS(JavaScript)로 사이트가 구성됨을 확인.**

![picoCTF: Scavenger Hunt(Web) 이미지 3](/assets/posts/picoctf-scavenger-hunt-web/image-03.png)

**3. 개발자 도구 "Source"의 HTML 코드에서 첫 번째 flag 조각 발견.**

![picoCTF: Scavenger Hunt(Web) 이미지 4](/assets/posts/picoctf-scavenger-hunt-web/image-04.png)

**4. CSS 코드에서 두 번째 flag 조각 발견.**

![picoCTF: Scavenger Hunt(Web) 이미지 5](/assets/posts/picoctf-scavenger-hunt-web/image-05.png)

**5. JS 코그에서 세 번째 flag 조각 힌트 발견.**

![picoCTF: Scavenger Hunt(Web) 이미지 6](/assets/posts/picoctf-scavenger-hunt-web/image-06.png)

**6. 힌트에서 "robots.txt" 유추**

**7. "robots.txt"에서 세 번째 flag 조각 발견 및 네 번째 flag 조각 힌트 발견.**

![picoCTF: Scavenger Hunt(Web) 이미지 7](/assets/posts/picoctf-scavenger-hunt-web/image-07.png)

**8. 힌트를 통해 ".htaccess" 유추**

[![Link preview](/assets/posts/picoctf-scavenger-hunt-web/link-preview-01.png "dorami-card:%7B%22title%22%3A%20%22%5BApache2%5D%20.htaccess%20%EC%84%A4%EC%A0%95%20%ED%8C%8C%EC%9D%BC%20%EC%82%AC%EC%9A%A9%ED%95%98%EA%B8%B0%22%2C%20%22description%22%3A%20%22.htaccess%EB%9E%80%20htaccess%EB%8A%94%20%27hypertext%20acess%27%EC%9D%98%20%EC%95%BD%EC%9E%90%EB%A1%9C%20%EB%94%94%EB%A0%89%ED%86%A0%EB%A6%AC%EC%97%90%20%EB%8C%80%ED%95%9C%20%EC%84%A4%EC%A0%95%20%EC%98%B5%EC%85%98%EC%9D%84%20%EC%A0%9C%EA%B3%B5%ED%95%9C%EB%8B%A4.%20Apache%20%EC%9B%B9%20%EC%84%9C%EB%B2%84%EC%97%90%EC%84%9C%20apache2.conf%20%EB%98%90%EB%8A%94%20sites-enabled%20%ED%8C%8C%EC%9D%BC%EC%9D%84%20%ED%99%95%EC%9D%B8%ED%95%B4%EB%B3%B4%EB%A9%B4%20%EB%8B%A4%EC%9D%8C%EA%B3%BC%20%EA%B0%99%EC%9D%B4%20%ED%83%9C%EA%B7%B8%EB%A5%BC%20%ED%86%B5%ED%95%B4%20%ED%8C%8C%EC%9D%BC%EC%9D%B4%20%EC%9C%84%EC%B9%98%ED%95%9C%20%EA%B2%BD%EB%A1%9C%22%7D")](<https://doqtqu.tistory.com/216>)

**9. ".htaccess"에서 네 번째 flag 조각 발견 및 다섯 번째 flag 조각 힌트 발견.**

![picoCTF: Scavenger Hunt(Web) 이미지 8](/assets/posts/picoctf-scavenger-hunt-web/image-08.png)

**10. 힌트를 통해 ".DS_Store" 유추**

[![Link preview](/assets/posts/picoctf-scavenger-hunt-web/link-preview-02.png "dorami-card:%7B%22title%22%3A%20%22Mac%20OS%20X%EC%9D%98%20%EC%88%A8%EA%B2%A8%EC%A7%84%20%ED%8C%8C%EC%9D%BC%EB%93%A4%EA%B3%BC%20%EB%94%94%EB%A0%89%ED%86%A0%EB%A6%AC%22%2C%20%22description%22%3A%20%22Mac%20OS%20X%EC%9D%98%20%EC%88%A8%EA%B2%A8%EC%A7%84%20%ED%8C%8C%EC%9D%BC%EB%93%A4%EA%B3%BC%20%EB%94%94%EB%A0%89%ED%86%A0%EB%A6%AC%EB%93%A4%20%EC%98%AE%EA%B8%B4%20%EA%B8%80%20-%20Mac%20OS%20X%20Hidden%20Files%20%26%20Directories%20Mac%20OS%20X%20%EB%B3%BC%EB%A5%A8%EC%97%90%EB%8A%94%20%EC%83%81%EB%8B%B9%ED%9E%88%20%EB%A7%8E%EC%9D%80%20%ED%8C%8C%EC%9D%BC%EB%93%A4%EA%B3%BC%20%EB%94%94%EB%A0%89%ED%86%A0%EB%A6%AC%EB%93%A4%28%ED%8F%B4%EB%8D%94%EB%93%A4%29%EC%9D%B4%20Finder%EC%97%90%EC%84%9C%EB%8A%94%20%EB%B3%B4%EC%9D%B4%EC%A7%88%20%EC%95%8A%EC%8A%B5%EB%8B%88%EB%8B%A4.%20%EB%8C%80%EB%B6%80%EB%B6%84%EC%9D%80%2C%20%EA%B7%B8%EB%9F%B4%EB%A7%8C%ED%95%9C%20%EC%9D%B4%EC%9C%A0%22%7D")](<https://aginamu.com/206>)

**11. ".DS_Store" 에서 마지막 flag 조각 발견**

![picoCTF: Scavenger Hunt(Web) 이미지 9](/assets/posts/picoctf-scavenger-hunt-web/image-09.png)

**12. flag: picoCTF{th4ts_4_l0t_0f_pl4c3s_2_lO0k_35844447}**

---

## **결론**

- 소스 코드 분석으로 문제 해결
