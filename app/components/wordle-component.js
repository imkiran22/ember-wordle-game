import Component from "@ember/component";
import { computed, action } from "@ember/object";
import { throttle, later } from "@ember/runloop";
import { tracked } from "@glimmer/tracking";
import { inject as service } from "@ember/service";
import WordleMixin from "../mixins/wordle-mixin";

export default class extends Component.extend(WordleMixin) {
  @service store;
  @service wordleService;
  @computed()
  get boxes() {
    const { numberOfColumns, totalChances } = this.wordleMeta;
    const boxes = [...new Array(numberOfColumns * totalChances).keys()];
    const twoDBox = [];
    let start = 0;
    const end = boxes.length;

    while (start < end) {
      twoDBox.push(boxes.slice(start, start + numberOfColumns));
      start = start + numberOfColumns;
    }
    return twoDBox;
  }

  @computed()
  get wordleMeta() {
    const obj = this.store.peekRecord("wordle", 1);
    return obj;
  }

  constructor() {
    super(...arguments);
    window.addEventListener("keydown", (ev) => {
      throttle(this, this.callback, ev, 100);
    });
  }

  willDestroy() {
    window.removeEventListener("keydown", () => {});
  }
}
