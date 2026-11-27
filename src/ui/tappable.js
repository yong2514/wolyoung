/**
 * 버튼 위에서 눌렀다 뗀 경우에만 onTap (조이스틱 손가락이 지나가다 떼도 무시).
 * isEnabled()가 false면 안 눌림. onDown: 눌렀을 때 (눌린 모양 등)
 */
export function tappable(obj, isEnabled, onTap, onDown) {
  obj.setInteractive();
  let pressed = false;
  obj.on('pointerdown', () => { if (isEnabled()) { pressed = true; onDown?.(); } });
  obj.on('pointerout', () => { pressed = false; });
  obj.on('pointerup', () => { if (pressed) { pressed = false; onTap(); } });
}
