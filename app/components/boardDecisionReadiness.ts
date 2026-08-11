export function shouldReleaseOpeningDecision({
  cardLanded,
  boardVisible,
  alreadyReleased,
}: {
  cardLanded: boolean;
  boardVisible: boolean;
  alreadyReleased: boolean;
}): boolean {
  return cardLanded && boardVisible && !alreadyReleased;
}
