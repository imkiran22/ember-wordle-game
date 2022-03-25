import Component from "@glimmer/component";
import { inject as service } from "@ember/service";
import { computed, action } from "@ember/object";

export default class extends Component {
  @service store;
  @service wordleService;
  get wordleInfo() {
    return this.wordleService.wordleMeta;
  }

  get letterPositions() {
    return this.wordleService.letterPositions;
  }

  get correctAnswer() {
    return this.wordleService.correctAnswer;
  }
}
