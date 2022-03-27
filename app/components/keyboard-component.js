import Component from "@ember/component";
import { inject as service } from "@ember/service";
import { computed, action } from "@ember/object";
import WordleMixin from "../mixins/wordle-mixin";

export default class extends Component.extend(WordleMixin) {
  @service wordleService;

  @computed("wordleService.keyboardMeta.alphabets")
  get keyboard() {
    const obj = this.wordleService.keyboardMeta.alphabets;
    const keyboardArr = Object.keys(obj).reduce((acc, curr) => {
      acc.push({ key: curr, className: obj[curr] });
      return acc;
    }, []);
    return keyboardArr;
  }

  @computed("keyboard")
  get keyboardFirstRow() {
    return this.keyboard.slice(0, 10);
  }

  @computed("keyboard")
  get keyboardSecondRow() {
    return this.keyboard.slice(10, 19);
  }

  @computed("keyboard")
  get keyboardThirdRow() {
    const row = this.keyboard.slice(19);
    row.push({ key: "Backspace", className: "" });
    row.unshift({ key: "Enter", className: "" });
    return row;
  }

  @action
  pressKey(board) {
    if (board === "Enter") {
      this.send("enter");
    } else if (board === "Backspace") {
      this.send("backSpace");
    } else {
      //FIX ME - Propagate correct character keycodes
      this.callback({ keyCode: 65, key: board });
    }
  }

  @action
  enter() {
    if (
      !this.wordleService.checkIfCurrentRowIsFreezed() &&
      this.wordleService.checkIfLastPositionInRow()
    ) {
      this.wordleService._checkAnswer();
    }
  }

  @action
  backSpace() {
    if (!this.wordleService.checkIfCurrentRowIsFreezed()) {
      this.wordleService._removeCurrentLetter();
    }
  }
}
