import Component from "@glimmer/component";
import { inject as service } from "@ember/service";

export default class extends Component {
  @service store;
  @service wordleService;
  errorMessage = "Not in word list";
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
