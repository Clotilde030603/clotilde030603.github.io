---
title: "picoCTF: logon(Web)"
date: 2025-01-22
summary: "로그인 후 admin 쿠키 값을 확인하고 False에서 True로 바꿔 flag를 찾습니다."
category: "보안/CTF 풀이"
tags: ["CTF", "웹 보안"]
sourceUrl: "https://learntoflyclotilde.tistory.com/entry/picoCTF-logonWeb"
draft: false
---

## **{{color:#52643c}}Problem{{/color}}**

![picoCTF: logon(Web) 이미지 1](/assets/posts/picoctf-logon-web/image-01.png)

{{color:#52643c}}hint 1 : Hmm it doesn't seem to check anyone's password, except for Joe's?{{/color}}

---

## **{{color:#52643c}}Solution{{/color}}**

**1. 문제 사이트 접속.**

![picoCTF: logon(Web) 이미지 2](/assets/posts/picoctf-logon-web/image-02.png)

**2. ID : admin, PW : admin으로 로그인.**

![picoCTF: logon(Web) 이미지 3](/assets/posts/picoctf-logon-web/image-03.png)

**3. 로그인은 되었지만 flag 값은 X**

**4. 개발자도구 Cookie 값 확인 → “admin” 값이 “False”**

![picoCTF: logon(Web) 이미지 4](/assets/posts/picoctf-logon-web/image-04.png)

**5. “admin” 값 “False” → ”True”로 변경**

![picoCTF: logon(Web) 이미지 5](/assets/posts/picoctf-logon-web/image-05.png)

**6. flag 값 발견**

![picoCTF: logon(Web) 이미지 6](/assets/posts/picoctf-logon-web/image-06.png)

---

## **{{color:#697d4f}}결론{{/color}}**

- Cookies 값 변경을 통해 문제 해결
