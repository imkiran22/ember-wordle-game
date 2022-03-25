export function getAlphabets() {
  return [
    "q",
    "w",
    "e",
    "r",
    "t",
    "y",
    "u",
    "i",
    "o",
    "p",
    "a",
    "s",
    "d",
    "f",
    "g",
    "h",
    "j",
    "k",
    "l",
    "z",
    "x",
    "c",
    "v",
    "b",
    "n",
    "m"
  ];
}

export function createKeyboard() {
  const alphabet = getAlphabets();
  return alphabet.reduce((acc, curr) => {
    acc[curr] = "";
    return acc;
  }, {});
}

export function getDOMElement(position) {
  const element = document.querySelector(
    `.wrapper  div[data-test-id='${position}']`
  );
  return element;
}
