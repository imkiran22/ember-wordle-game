import Mixin from "@ember/object/mixin";
import { inject as service } from "@ember/service";

const WordleMixin = Mixin.create({
  wordleService: service(),

  callback(ev) {
    const {
      freezeRows,
      numberOfColumns,
      totalChances,
      totalWordsLength,
      position,
      freezed,
      currentChance,
      gameOver
    } = this.wordleService.wordleMeta;
    const { keyCode, key } = ev;

    if ((freezed && !["Backspace", "Enter"].includes(key)) || gameOver) return;

    if (keyCode >= 65 && keyCode <= 90) {
      if (position < totalWordsLength) {
        const element = this.wordleService._element(position);
        element.textContent = key;
        this.wordleService.wordleMeta.set("position", position + 1);
      }
    } else if (key === "Backspace") {
      // Backspace key deletes the word
      let pos = position - 1;
      if (pos >= 0 && !this.wordleService.checkIfCurrentRowIsFreezed()) {
        this.wordleService.wordleMeta.set("position", pos);
        const element = this.wordleService._element(pos);
        element.textContent = "";
      }
    } else if (keyCode === 13 || key === "Enter") {
      // Enter key submit the words only if at the last letter
      if (
        !this.wordleService.checkIfCurrentRowIsFreezed() &&
        this.wordleService.checkIfLastPositionInRow()
      ) {
        this.wordleService._checkAnswer();
      }
    }

    if (key !== "Enter" && !this.wordleService.checkIfCurrentRowIsFreezed()) {
      let evaluateFreezed = false;
      if (this.wordleService.checkIfLastPositionInRow()) {
        evaluateFreezed = true;
      } else if (this.wordleService.wordleMeta.position % 5 === 0) {
        evaluateFreezed = false;
      }
      this.wordleService.wordleMeta.set("freezed", evaluateFreezed);
    }
  }
});

export default WordleMixin;
