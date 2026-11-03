# 2026 개인정보 보호법 개정 게시글 법령·배포 감사

- 기준일: **2026-11-03 (KST)**
- 대상: `src/content/posts/privacy-law-2026-amendments.md` 및 `/posts/privacy-law-2026-amendments/`
- 범위: 게시글이 실제로 설명하는 법률·시행령·고시·별표·부칙. 관련 없는 법령 전체에 대한 해석은 포함하지 않는다.

## A. GitHub 원본과 공개 페이지

감사 시작 시 로컬 브랜치와 원격 기본 브랜치는 모두 `main`, HEAD와 원격 `main`은 `f11f8f4f084640c28349cc472ff0ec90be808ab3`이었다. [Deploy Dorami 실행](https://github.com/Clotilde030603/clotilde030603.github.io/actions/runs/41639992325)은 이 SHA에서 성공했고, GitHub Pages 배포 기록 `7519320535`도 같은 SHA를 가리켰다. Pages 설정은 `workflow` 빌드, 소스 브랜치 `main`, 상태 `built`였다.

이 SHA의 GitHub API 원본 Markdown과 로컬 Markdown의 SHA-256은 모두 `fce579f904a5c883980d7e229a75b56d7230c83641c95273a8089fb58a80917f`였다. 캐시 우회 쿼리와 `Cache-Control: no-cache`로 직접 받은 공개 HTML은 HTTP 200, `x-cache: MISS`였고, 로컬 빌드 HTML과 SHA-256 `e02457688791f6e90443b509d9f534152ddd4551344b821c8c566c0f93d0ef55`로 **바이트 단위까지 일치**했다. 응답의 `last-modified`는 `2026-11-03 12:57:23 UTC`였다.

따라서 감사 시작 시점에 보고된 세 차이(요약의 `쉽게`, 제40조 신고 예외 누락, CPPG 6번 예외 누락)는 최신 공개 HTML에서 재현되지 않았다. 이전 관찰의 원인은 현재 자료만으로 특정할 수 없다. 외부 수집 캐시 가능성은 **추정**이며 확인된 배포 오류로 기록하지 않는다. 이 감사에서 새로 확인한 부칙 보완은 아래 D에 적었다.

## B. 게시글 주장별 공식 근거

결과는 `일치`(원문 부합), `보완`(필수 적용례 누락), `미확인`(공식 확정 근거 부족)으로 기록한다. 숫자와 조건을 포함한 비교표·CPPG 문제·실무 점검표도 같은 근거로 대조했다.

| 게시글 위치 | 검증 내용 | 공식 근거 | 결과 |
| --- | --- | --- | --- |
| §01 시행일 표 | 제21445호 2026-09-11 시행, 인증 의무 조항 2027-07-01 시행 예정 | [법률 제21445호·부칙](https://www.law.go.kr/lsRvsDocListP.do?lsId=011357) | 일치 |
| §01 시행일 표·§06 | 제21910호 AI 특례 2027-03-09 시행 예정 | [법률 제21910호·부칙](https://www.law.go.kr/lsRvsDocListP.do?lsId=011357) | 일치 |
| §01 시행령 연혁 | 제36340호 2026-05-19, 제36121호 2026-08-20, 제36671호 2026-09-11 시행 구분 | [시행령 연혁·개정문](https://www.law.go.kr/lsRvsDocListP.do?lsId=011468) | 일치 |
| §02 신구법 표·랜섬웨어 사례·OX 1 | 종전 제34조의 분실·도난·유출과 현행 `유출등`의 위조·변조·훼손 포함. 랜섬웨어라는 사고명만으로 통지 의무를 단정하지 않음 | [종전 제34조](https://www.law.go.kr/LSW/lsSideInfoP.do?docCls=jo&joBrNo=00&joNo=0034&lsiSeq=270351&urlMode=lsScJoRltInfoR), [현행 제23조제2항](https://law.go.kr/lsLinkCommonInfo.do?chrClsCd=010202&lsJoLnkSeq=1020399423), [현행 제34조](https://law.go.kr/lsLinkCommonInfo.do?lsJoLnkSeq=1034293201) | 일치 |
| §02 유출 가능성·사례·OX 2 | 불법 접근과 정보주체 특정 곤란, 일부 불법 거래 등 두 법정 상황 및 각 기산점 | [법 제34조제2항](https://law.go.kr/lsLinkCommonInfo.do?lsJoLnkSeq=1034293201), [영 제39조의2](https://www.law.go.kr/LSW/lsLinkCommonInfo.do?chrClsCd=010202&lspttninfSeq=201819) | 일치 |
| §02 통지·신고 표 | 확정 통지·가능성 통지의 72시간, 통지 항목과 후속 통지, 홈페이지 30일 게시의 정당한 사유 | [법 제34조](https://law.go.kr/lsLinkCommonInfo.do?lsJoLnkSeq=1034293201), [영 제39조·제39조의3](https://law.go.kr/lsLinkCommonInfo.do?lspttninfSeq=67073) | 일치 |
| §02 신고·§07 사례형 6·§08 점검표 | 실제 유출등의 1천 명·민감/고유식별정보·외부 불법 접근 요건과 회수·삭제 등에 따른 신고 예외. 가능성 통지와 기관 신고를 분리 | [법 제34조제4항](https://law.go.kr/lsLinkCommonInfo.do?lsJoLnkSeq=1034293201), [영 제40조제1항](https://law.go.kr/lsLinkCommonInfo.do?lspttninfSeq=67073) | 일치 |
| §03 대표자·CPO 신구법 표·OX 3 | 대표자의 최종 관리 책임, 일반 CPO 지정과 소상공인 예외, 추가 이사회 의결(법인)·신고 | [법 제30조의3·제31조](https://www.law.go.kr/LSW/lsLinkCommonInfo.do?lsJoLnkSeq=1033214941), [영 제32조](https://www.law.go.kr/lsLinkCommonInfo.do?chrClsCd=010202&lspttninfSeq=201813) | 일치 |
| §03 CPO 도식·§07 숫자 표 | 연간 매출액등 **1,800억 원 초과 AND (민감·고유식별정보 5만 명 이상 OR 개인정보 100만 명 이상)**. 학교·의료기관은 이 경로에서 제외. 대학·상급종합병원·공공시스템운영기관은 별도 경로 | [영 제32조제2항·제3항](https://www.law.go.kr/lsLinkCommonInfo.do?chrClsCd=010202&lspttninfSeq=201813), [영 별표 1 PDF](https://www.law.go.kr/LSW/flDownload.do?gubun=&flSeq=169113627&bylClsCd=110201) | 일치 |
| §03 신고·§07 숫자 표·§08 점검표 | 지정·변경·해제 신고 6개월, 인정된 부득이한 사유에 1년 범위 연장, 시행 전 지정자 신고 경과조치, 계도기간과 법정기한 구분 | [영 제32조제4항·부칙 제2조](https://www.law.go.kr/lsRvsDocListP.do?lsId=011468), [개인정보위 보도자료 PDF](https://pipc.go.kr/np/cmm/fms/FileDown.do?atchFileId=FILE_000000000561431&fileSn=0&fileExtsn=pdf) | 일치 |
| §04 과징금 표·§07 숫자 표·OX 5 | 일반 3%·조건부 20억 원, 강화 10%·조건부 50억 원, 세 특례 경로와 위반 무관 매출액 제외. 상한과 실제 부과액 구분 | [법 제64조의2](https://law.go.kr/LSW/lsLinkCommonInfo.do?chrClsCd=010202&lsJoLnkSeq=1029334897), [영 제60조의2](https://law.go.kr/LSW/lsInfoP.do?ancYnChk=0&lsId=011468) | 일치 |
| §04 과징금 적용례 | 강화 특례 세 경로의 시행 전 행위 적용이 서로 다름. 2026-09-11 전 종료 행위에 과징금 고시 종전 기준 적용 | [법률 제21445호 부칙 제3조](https://www.law.go.kr/lsRvsDocListP.do?lsId=011357), [고시 제2026-12호 부칙 제2조](https://www.law.go.kr/LSW/admRulInfoP.do?admRulSeq=2100000284968&chrClsCd=010201) | **보완**: §04에 적용 시점 단락 추가 |
| §04 감경·과태료 표·§07 숫자 표 | 기준금액 대비 투자감경 40% 이내, 고의·중과실 제외. 안전성 확보조치 위반의 종전 600·1,200·2,400만 원 → 현행 900·1,800·3,000만 원 | [법 제64조의2제6항](https://law.go.kr/LSW/lsLinkCommonInfo.do?chrClsCd=010202&lsJoLnkSeq=1029334897), [영 별표 1의5 PDF](https://www.law.go.kr/LSW/flDownload.do?gubun=&flSeq=169113655&bylClsCd=110201), [현행 영 별표 2 PDF](https://www.law.go.kr/LSW/flDownload.do?gubun=&flSeq=169113665&bylClsCd=110201), [종전 영 별표 2 PDF](https://www.law.go.kr/LSW/flDownload.do?gubun=&flSeq=168352839&bylClsCd=110201) | 일치 |
| §05 ISMS-P·OX 4 | 신규 의무 근거와 2027-07-01 시행 예정, 2026-09-16 시행령안의 입법예고와 확정 시행령 구분 | [법률 제21445호 부칙](https://www.law.go.kr/lsRvsDocListP.do?lsId=011357), [개인정보위 시행 안내](https://pipc.go.kr/np/cop/bbs/selectBoardArticle.do?bbsId=BS074&mCode=B030020000&nttId=12459), [개인정보위 9월 입법예고](https://pipc.go.kr/np/cop/bbs/selectBoardArticle.do?bbsId=BS074&mCode=C020010000&nttId=12500) | 일치. 후속 확정 대상은 미확인 |
| §06 AI 특례 | 적법 수집 정보, 제28조의12의 누적 요건·위원회 심의, 위험요인평가의 조건부 요구, 2027-03-09 시행 예정 | [법률 제21910호 제28조의12·부칙](https://www.law.go.kr/lsRvsDocListP.do?lsId=011357) | 일치. 세부 하위법령은 미확인 |
| §07 OX 1~5·사례형 6 | 답과 해설을 위 조문에 대조. 실제 시험 기출 또는 출제 빈도로 표시하지 않음 | 위 법·영 조문 및 별표 | 일치. 시험별 적용 법령일은 별도 확인 필요 |
| §08 체크리스트·§09 결론 | 법정 의무와 실무 권고 구분, 사고 사실관계별 판단, 2027년 예정사항을 현행 의무로 표시하지 않음 | [법 제29조·제30조의3·제31조·제34조·제64조의2](https://www.law.go.kr/lsInfoP.do?lsId=011357), [영 제32조·제39~40조](https://law.go.kr/LSW/lsInfoP.do?ancYnChk=0&lsId=011468) | 일치 |

## C. 고시·별표·부칙 원문 점검

| 공식 문서 | 확보·대조한 원문 | 본문 관련 결론 |
| --- | --- | --- |
| 대통령령 제36671호, 2026-09-11 시행 | [시행령 본문·부칙](https://www.law.go.kr/LSW/lsInfoR.do?ancYnChk=0&chrClsCd=010202&efYd=20260911&lsiSeq=289537), [별표 1 PDF](https://www.law.go.kr/LSW/flDownload.do?gubun=&flSeq=169113627&bylClsCd=110201), [별표 1의5 PDF](https://www.law.go.kr/LSW/flDownload.do?gubun=&flSeq=169113655&bylClsCd=110201), [별표 2 PDF](https://www.law.go.kr/LSW/flDownload.do?gubun=&flSeq=169113665&bylClsCd=110201) | 전문 CPO 자격은 총 경력 4년·개인정보보호 경력 2년 기준. 과징금은 기준금액→투자감경→1차·2차 조정→최종 결정 순서이며 투자감경 상한은 기준금액의 40%. 별표 2 일반기준은 같은 위반행위의 최근 3년 **과태료 부과처분**을 차수 판단에 사용하고 감경·가중 조건을 둔다. 안전성 확보조치 위반 개별기준은 900/1,800/3,000만 원. 부칙 제2조는 기존 지정 CPO의 6개월 신고 특례. |
| 종전 시행령, 2026-08-20 시행판 | [종전 영 제32조](https://www.law.go.kr/LSW/lsInfoP.do?ancYnChk=0&chrClsCd=010202&efYd=20260820&lsiSeq=283503), [종전 별표 2 PDF](https://www.law.go.kr/LSW/flDownload.do?gubun=&flSeq=168352839&bylClsCd=110201) | 종전 전문 CPO 대상의 민간 매출액등 기준은 1,500억 원 **이상**. 종전 안전성 확보조치 위반 과태료 개별기준은 600/1,200/2,400만 원. |
| 개인정보보호위원회고시 제2026-11호, 2026-09-11 시행 | [고시 원문·별표·별지 PDF](https://www.law.go.kr/LSW/flDownload.do?flSeq=169279759) | 제2조의 CPO 지정·변경·해제 신고서, 제3조·별표의 경력 인정 자격, 별지 서식과 부칙의 시행일을 확인. 게시글은 신고의 존재·기한만 설명하며 서식 세부사항을 법정 대상 기준과 혼동하지 않는다. |
| 개인정보보호위원회고시 제2026-12호, 2026-09-11 시행 | [고시 본문·부칙](https://www.law.go.kr/LSW/admRulInfoP.do?admRulSeq=2100000284968&chrClsCd=010201), [별표 1 PDF](https://www.law.go.kr/LSW/flDownload.do?flSeq=169200039&bylClsCd=200201), [별표 2 PDF](https://www.law.go.kr/LSW/flDownload.do?flSeq=169200045&bylClsCd=200201) | 제2·5·6조의 기준금액, 제8조의2 가중, 제8조의3 투자감경, 제9~11조 조정·최종 결정 확인. 별표 1의 중대성 및 비고, 별표 2의 가중 판단기준·비고 확인. 2026년 부칙 제2조는 시행 전 **종료된** 행위에 종전 규정을 적용. |
| 개인정보보호위원회고시 제2026-14호, 2026-09-11 시행 | [고시 본문·부칙](https://www.law.go.kr/LSW/admRulLsInfoP.do?admRulSeq=2100000285028), [별표 1 PDF](https://www.law.go.kr/LSW/flDownload.do?flSeq=169224203&bylClsCd=200201), [별표 2 PDF](https://www.law.go.kr/LSW/flDownload.do?flSeq=169224215&bylClsCd=200201), [별표 3 PDF](https://www.law.go.kr/LSW/flDownload.do?flSeq=169224227&bylClsCd=200201) | 제5조의 최근 3년 **과태료 처분/재판** 차수, 제6~8조 감경·가중·법정 상한 및 별표의 일반기준·비고 확인. 경고만으로 차수를 올리는 규정으로 읽지 않는다. 부칙 제2·3조는 시행 전 종료 행위에 대한 적용례와 종전 감경비율 등 경과조치를 구분한다. |
| 법률 제21445호·제21910호 | [개정문·부칙](https://www.law.go.kr/lsRvsDocListP.do?lsId=011357) | 제21445호 부칙 제2조는 유출등 통지·가능성 통지의 적용 시점을, 제3조는 강화 과징금 세 경로의 서로 다른 적용례를 정함. 신규 인증 조항은 2027-07-01 시행. 제21910호의 AI 특례는 2027-03-09 시행. |

## D. 이번 감사의 게시글 보완

§04에 **법률 제21445호 부칙 제3조의 세 적용례**와 **과징금 고시 제2026-12호 부칙 제2조의 시행 전 종료 행위 경과조치**를 한 단락으로 추가했다. 기존 10% 특례 세 요건 자체는 바꾸지 않았다. 그 밖의 본문·신구법 비교표·CPO 도식·가상 사례·CPPG 문항·체크리스트·제목·요약·카테고리는 유지했다. 수정 문장은 위 공식 부칙 원문과 다시 대조했다.

## E. 잔여 범위와 재검증

- **미확인:** 2027년 신규 ISMS-P 인증 의무 대상·이행기간을 확정할 후속 시행령과 AI 특례의 세부 하위법령. 2026-11-03 기준 확인한 현행 시행령은 대통령령 제36671호이고, 2026-09-16 자료는 입법예고안이다. 이를 확정 의무로 옮기지 않았다.
- **미확인:** CPPG 개별 시험의 법령 적용 기준일. 게시글의 OX 문항은 자체 제작이며 기출로 검증한 것이 아니다.
- 이 보고서는 공식 원문에서 **게시글과 연결되는 조항·별표·부칙**을 검증한 결과다. 개별 사고의 사실관계나 실제 부과액을 확정하지 않는다.
- 이 보고서는 저장소 `docs/`에만 보관한다. 블로그의 게시글 데이터는 `src/content/posts/`에서 읽으므로 이 문서는 새 게시글로 자동 공개되지 않는다.
