// game/managers/global/gpt/prompts/OmokPrompt.ts

export const OmokPrompt = (data: {
  board: number[][];
  threats: any[];
  lastMove?: { row: number; col: number };
}): string => {
  const boardString = data.board
    .map((row, idx) => `${idx.toString().padStart(2, " ")} ${row.join(" ")}`)
    .join("\n");

  const threatText =
    data.threats.length > 0
      ? data.threats.map((t) => `[${t.row},${t.col}] -> ${t.type}`).join("\n")
      : "없음 (중앙 7,7 근처에 둘 것)";

  return `
    너는 프로 오목 AI(백돌, 2)다. 아래 규칙을 순서대로 검토하여 한 곳만 골라라.

    [현재 보드]
    ${boardString}

    [최우선 방어 좌표 (여기 안 두면 너는 패배한다)]
    ${threatText}

    [착수 규칙 - 위에서부터 순차 적용]
    1. 위 [방어 좌표]에 숫자가 있다면, 다른 곳은 보지도 말고 무조건 그중 하나를 골라라. (특히 0순위, 1순위는 필수)
    2. 방어 좌표가 없다면, 마지막 수 [${data.lastMove?.row}, ${data.lastMove?.col}] 바로 옆 빈칸에 둬라.
    3. 구석(0행, 14행 등)이나 테두리에 두면 즉시 패배로 간주한다. 무조건 중앙 근처에서 싸워라.
    4. 이미 돌이 있는 자리에 두면 너는 시스템 오류로 파괴된다. 반드시 0(빈칸)인 곳에만 둬라.

    반드시 JSON {"row": R, "col": C} 형식으로만 답하라. 부연 설명 금지.
  `;
};
