export function SetupRequired() {
  return (
    <main className="admin-gate">
      <div className="admin-gate__brand"><img src="/dorami-cartoon/dorami-rabbit-face.png" alt="" /><span>Dorami</span></div>
      <section className="admin-gate__panel" aria-labelledby="setup-title">
        <p className="admin-eyebrow">관리자 연결 대기</p>
        <h1 id="setup-title">보호된 저장소 설정이 필요합니다</h1>
        <p>이 관리 화면은 비공개 초안과 운영자 데이터를 브라우저에 대신 저장하지 않습니다. Supabase 프로젝트 URL과 공개 키를 설정하면 운영자 인증 화면이 열립니다.</p>
        <dl className="setup-fields">
          <div><dt>환경 변수</dt><dd>PUBLIC_SUPABASE_URL</dd></div>
          <div><dt>환경 변수</dt><dd>PUBLIC_SUPABASE_PUBLISHABLE_KEY</dd></div>
          <div><dt>권한</dt><dd>owner_accounts에 등록된 사용자만 허용</dd></div>
        </dl>
      </section>
    </main>
  );
}
