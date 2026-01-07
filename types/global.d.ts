// Window 객체에 커스텀 속성 추가를 위한 타입 선언

// 브라우저 window 객체 등 타입스크립트가 모르는 객체들이 있어서 declare 사용
// -> 사용하지 않으면 또 에러린트 발생으로...

declare global {
  interface Window {
    __avatarDataManager?: unknown; // AvatarDataManager 타입 (순환 참조 방지)
    __avatarManager?: unknown; // AvatarManager 타입
    __mainScene?: unknown; // MainScene 타입
  }
}

// 이 파일을 모듈로 만들기 위해 필요
export {};
