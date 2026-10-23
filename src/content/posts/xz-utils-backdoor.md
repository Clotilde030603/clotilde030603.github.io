---
title: "XZ Utils 백도어: 오픈소스 공급망 공격의 전개와 대응"
date: 2026-10-24
summary: "CVE-2024-3094가 XZ Utils에 들어간 과정과 발견 당시 영향 범위, 배포판별 대응을 정리합니다."
category: "보안/보안 동향"
tags: ["공급망 보안", "취약점"]
draft: false
---

2024년 3월, XZ Utils 5.6.0과 5.6.1에서 백도어가 발견됐습니다. XZ Utils는 파일을 압축·해제하는 프로그램이고, `liblzma`는 그 기능을 다른 프로그램에서도 쓸 수 있게 제공하는 라이브러리입니다. 백도어는 이 라이브러리를 빌드하는 과정에 숨겨져 있었습니다.

SSH는 원격 컴퓨터에 안전하게 접속할 때 사용하는 통신 방식이며, `sshd`는 접속을 받는 서버 프로그램입니다. 이번 사건에서는 특정 Linux 배포판의 구성에서 변조된 `liblzma`가 SSH 서버 프로세스의 간접 의존 경로에 포함되어, 조건이 맞으면 인증 처리에 개입하고 인증 전 원격 코드 실행으로 이어질 수 있었습니다.

보안뉴스의 [첫 번째 기사](https://www.boannews.com/news/articleView.html?idxno=128372)를 출발점으로 삼고, 오픈소스 생태계에 미친 영향을 다룬 [두 번째 기사](https://www.boannews.com/news/articleView.html?idxno=128442)도 함께 참고했습니다. 공격 흐름과 영향 범위는 Andres Freund의 최초 공개 보고, Red Hat과 OpenSSF의 설명을 대조해 정리했습니다.

## 한눈에 보기

- **취약점:** CVE-2024-3094
- **영향 버전:** XZ Utils 5.6.0 및 5.6.1을 포함한 일부 배포 패키지
- **핵심:** 변조된 배포 파일의 빌드 과정이 `liblzma`에 백도어를 포함시켰습니다.
- **영향:** 특정 Linux 배포판 구성에서 SSH 인증 처리에 개입할 수 있었습니다.
- **발견:** Andres Freund가 SSH 접속에서 관찰한 지연과 오류를 조사하다 악성 변경을 발견했습니다.
- **대응:** 배포판별로 영향 여부와 조치가 달랐으므로 각 배포판의 공식 공지를 확인해야 합니다.

## 공격은 어떻게 진행됐나

공개된 메일과 커밋 기록으로 재구성한 타임라인은 2021년 Jia Tan 계정의 XZ 프로젝트 기여부터 시작합니다. 이후 해당 계정은 프로젝트에서 더 많은 역할을 맡게 되었고, 일부 공개 이메일에서는 유지관리자의 업무 부담과 프로젝트 관리 권한 이전을 재촉하는 계정들의 활동도 확인됩니다.

이 과정에 등장하는 모든 계정의 배후나 최초 의도가 밝혀진 것은 아닙니다. 따라서 “2021년부터 백도어를 준비했다”고 단정하기보다, **공개 기록에서 기여와 유지관리 권한이 단계적으로 늘어난 뒤 악성 코드가 추가된 흐름**으로 보는 것이 정확합니다. Russ Cox의 [타임라인 분석](https://research.swtch.com/xz-timeline)은 날짜별 근거를 연결하면서 추정인 부분도 구분합니다.

![XZ Utils 공개 기록에서 확인되는 주요 시점](/assets/posts/xz-utils-backdoor/timeline.svg "2021년 첫 공개 기여부터 2024년 3월 발견까지의 타임라인")

2024년 2월에는 백도어의 일부가 테스트용 파일에 숨겨졌습니다. 이어 배포용 소스 tarball에 포함된 빌드 스크립트가 그 데이터를 꺼내 빌드에 반영하도록 수정됐습니다. 이 악성 빌드 스크립트는 공개 Git 저장소의 일반 소스와 달리 배포 tarball에 들어 있었습니다. 저장소만 확인해서는 실제 배포 파일의 차이를 놓칠 수 있었던 이유입니다.

악성 코드가 모든 빌드에서 작동한 것은 아닙니다. Red Hat은 x86_64 아키텍처와 systemd·sshd를 사용하는 특정 환경을 설명했고, OpenSSF도 배포 패키지와 빌드 조건에 따라 영향이 달라졌다고 안내했습니다. 따라서 “XZ Utils를 사용하는 모든 Linux 시스템이 영향을 받았다”고 일반화할 수 없습니다.

![테스트 파일에서 시작해 특정 SSH 인증 경로에 영향을 주는 백도어의 흐름](/assets/posts/xz-utils-backdoor/attack-flow.svg "XZ Utils 백도어의 빌드 및 실행 흐름")

## 어떻게 발견됐나

Andres Freund는 개발 환경에서 SSH 로그인의 지연과 CPU 사용량이 평소와 다른 점, `valgrind` 오류를 조사했습니다. `valgrind`는 프로그램의 메모리 사용 문제를 확인하는 도구입니다. OpenSSH가 `liblzma`를 직접 사용하는 것은 아닙니다. 다만 Debian 등 일부 배포판은 `sshd`에 systemd 알림 연동 패치를 적용했고, `libsystemd`가 `liblzma`에 의존했습니다. 이 간접 의존 경로를 따라가며 악성 동작을 확인한 Freund는 2024년 3월 29일 [oss-security 메일링 리스트에 발견 내용을 공개](https://www.openwall.com/lists/oss-security/2024/03/29/4)했습니다.

SSH 지연이라는 작은 이상 징후에서 시작해, 프로세스 동작과 라이브러리, 배포 파일의 빌드 과정을 차례로 확인하면서 백도어가 발견됐습니다.

![SSH 로그인 이상 징후에서 백도어 공개까지의 발견 과정](/assets/posts/xz-utils-backdoor/discovery-flow.svg "Andres Freund가 이상 징후를 조사해 백도어를 공개한 과정")

## 당시 영향과 대응

영향은 XZ Utils 5.6.0·5.6.1을 포함한 일부 시험·개발 배포판에 집중됐습니다. Red Hat은 자사 생태계에서 Fedora 40 베타와 Fedora Rawhide가 영향을 받았으며, RHEL은 영향받지 않았다고 밝혔습니다. 다른 Linux 배포판은 포함된 패키지와 빌드 방식에 따라 상황이 달랐습니다.

당시 배포판들은 취약 버전을 저장소에서 제거하거나 이전의 안전한 패키지로 되돌리는 조치를 안내했습니다. 이 사건은 배포판과 시점에 따라 적용된 패키지가 다르므로, 일괄 명령을 실행하기보다 사용 중인 배포판의 공식 공지와 패키지 버전을 확인하는 것이 우선입니다.

## 이 사건에서 확인할 점

이번 사건은 소프트웨어 공급망에서 **코드 검토만으로는 충분하지 않을 수 있다**는 점을 보여줬습니다. 공개 저장소의 코드와 실제 배포 tarball 사이에 차이가 있었고, 빌드 과정의 입력 파일이 최종 바이너리 동작에 영향을 줬습니다. 프로젝트 참여자의 권한 변화와 릴리스 과정도 보안 검토 대상이 될 수 있습니다.

다만 이를 “오픈소스는 위험하다”는 결론으로 단순화하기는 어렵습니다. 취약한 버전이 널리 안정 배포되기 전에 이상 징후를 조사하고 정보를 공유한 연구자와 배포판 커뮤니티의 대응도 피해 범위를 제한하는 데 중요했습니다.

## 참고 자료

- [보안뉴스: XZ Utils 백도어 악성코드, 2021년부터 공들여 준비해온 공급망 공격이었다](https://www.boannews.com/news/articleView.html?idxno=128372)
- [Andres Freund의 최초 공개 보고](https://www.openwall.com/lists/oss-security/2024/03/29/4)
- [Red Hat: XZ 보안 사고 대응 과정](https://www.redhat.com/de/blog/understanding-red-hats-response-xz-security-incident)
- [OpenSSF: XZ Utils 백도어와 공급망 보안](https://openssf.org/blog/2024/03/30/xz-backdoor-cve-2024-3094/)
- [Ars Technica: XZ Utils 백도어의 공격 흐름과 영향](https://arstechnica.com/security/2024/04/what-we-know-about-the-xz-utils-backdoor-that-almost-infected-the-world/)
- [Russ Cox: XZ 공급망 공격 타임라인](https://research.swtch.com/xz-timeline)
